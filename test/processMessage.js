/* global describe, it */

var assert = require("assert");
var fs = require("fs");

var index = require("../index");

describe('index.js', function() {
  describe('#processMessage()', function() {
    it('should process email data and make updates', function(done) {
      var data = {
        config: {},
        email: {
          source: "betsy@example.com"
        },
        emailData: fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.processed.txt").toString();
      index.processMessage(data)
        .then(function(data) {
          assert.equal(data.emailData,
            emailDataProcessed,
            "processEmail updated email data");
          done();
        });
    });

    it('should preserve an existing Reply-To header in emails', function(done) {
      var data = {
        config: {},
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.replyto.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.processed.txt").toString();
      index.processMessage(data)
        .then(function(data) {
          assert.equal(data.emailData,
            emailDataProcessed,
            "processEmail updated email data");
          done();
        });
    });

    it('should preserve an existing Reply-to header', function(done) {
      var data = {
        config: {},
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.replyto_case.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.replyto_case.processed.txt").toString();
      index.processMessage(data)
        .then(function(data) {
          assert.equal(data.emailData,
            emailDataProcessed,
            "processEmail updated email data");
          done();
        });
    });

    it('should allow overriding the From header in emails', function(done) {
      var data = {
        config: {
          fromEmail: "noreply@example.com"
        },
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.fromemail.txt").toString();
      index.processMessage(data)
        .then(function(data) {
          assert.equal(data.emailData,
            emailDataProcessed,
            "processEmail updated email data");
          done();
        });
    });

    it('should process multiline From header in emails', function(done) {
      var data = {
        config: {
          fromEmail: "noreply@example.com"
        },
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.from_multiline.source.txt")
            .toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.from_multiline.processed.txt").toString();
      index.processMessage(data)
        .then(function(data) {
          assert.equal(data.emailData,
            emailDataProcessed,
            "processEmail updated email data");
          done();
        });
    });

    it('should allow adding a prefix to the Subject in emails', function(done) {
      var data = {
        config: {
          subjectPrefix: "[PREFIX] "
        },
        email: {
          source: "betsy@example.com"
        },
        emailData: fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.subjectprefix.txt").toString();
      index.processMessage(data)
        .then(function(data) {
          assert.equal(data.emailData,
            emailDataProcessed,
            "processEmail updated email data");
          done();
        });
    });

    it('should allow overriding the To header in emails', function(done) {
      var data = {
        config: {
          toEmail: "actualTarget@example.com"
        },
        email: {
          source: "betsy@example.com"
        },
        emailData:
          fs.readFileSync("test/assets/message.txt").toString(),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      var emailDataProcessed = fs.readFileSync(
        "test/assets/message.toemail.txt").toString();
      index.processMessage(data)
        .then(function(data) {
          assert.equal(data.emailData,
            emailDataProcessed,
            "processEmail updated email data");
          done();
        });
    });

    // Regression: some mail servers fold the Message-ID value onto a
    // continuation line. A removal regex that only matched a single line left
    // the folded continuation behind, where it attached to the preceding
    // Content-Type header and corrupted its boundary parameter. SES then
    // rejected the send with "BadRequestException: In parameter list ...
    // expected ';', got '<'".
    it('should remove a folded (multiline) Message-ID header', function(done) {
      var data = {
        config: {},
        email: { source: "betsy@example.com" },
        emailData: [
          "Received: from example.com (example.com [127.0.0.1])",
          " by inbound-smtp.us-west-2.amazonaws.com with SMTP id abc123",
          " for info@example.com;",
          " Fri, 11 Mar 2016 06:20:55 +0000 (UTC)",
          "From: Betsy <betsy@example.com>",
          "To: info@example.com",
          "Subject: Folded headers test",
          "Content-Type: multipart/alternative;",
          " boundary=\"--boundary_0001\"",
          "Message-ID:",
          " <folded-message-id@example.com>",
          "Date: Fri, 11 Mar 2016 01:20:54 -0500",
          "",
          "This is a test message to info@example.com.",
          ""
        ].join("\r\n"),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      index.processMessage(data)
        .then(function(data) {
          assert.ok(!/folded-message-id/.test(data.emailData),
            "folded Message-ID should be removed entirely");
          assert.ok(/boundary="--boundary_0001"/.test(data.emailData),
            "Content-Type boundary parameter should be preserved");
          assert.ok(!/boundary="[^"]*"\r?\n\s*</.test(data.emailData),
            "boundary must not be followed by an orphaned <message-id>");
          done();
        });
    });

    // Regression: some senders emit an empty Reply-To address (e.g.
    // `Reply-To: "N" <>`). Forwarding it verbatim made SES reject the send
    // with "BadRequestException: Empty address". The empty header should be
    // dropped and a valid Reply-To regenerated from the From address.
    it('should replace an empty Reply-To address', function(done) {
      var data = {
        config: {},
        email: { source: "betsy@example.com" },
        emailData: [
          "Received: from example.com (example.com [127.0.0.1])",
          " for info@example.com;",
          " Fri, 11 Mar 2016 06:20:55 +0000 (UTC)",
          "Reply-To: \"N\" <>",
          "From: betsy@example.com",
          "To: info@example.com",
          "Subject: Empty Reply-To test",
          "Date: Fri, 11 Mar 2016 01:20:54 -0500",
          "",
          "Body here.",
          ""
        ].join("\r\n"),
        log: console.log,
        recipients: ["jim@example.com"],
        originalRecipient: "info@example.com"
      };
      index.processMessage(data)
        .then(function(data) {
          assert.ok(!/<\s*>/.test(data.emailData),
            "empty <> address should be removed");
          assert.ok(!/"N"/.test(data.emailData),
            "the empty Reply-To header should be dropped");
          assert.ok(/Reply-To: betsy@example\.com/.test(data.emailData),
            "a valid Reply-To should be derived from the From address");
          done();
        });
    });
  });
});
