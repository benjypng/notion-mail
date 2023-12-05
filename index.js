const { MailListener } = require("mail-listener5");
const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const mailOptions = {
  username: process.env.EMAIL,
  password: process.env.PW,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  connTimeout: 10000, // Default by node-imap
  authTimeout: 5000, // Default by node-imap,
  debug: console.log, // Or your custom function with only one incoming argument. Default: null
  autotls: "never", // default by node-imap
  tlsOptions: { rejectUnauthorized: false },
  mailbox: "INBOX", // mailbox to monitor
  searchFilter: ["UNSEEN"], // the search filter being used after an IDLE notification has been retrieved
  markSeen: false, // all fetched email willbe marked as seen and not fetched next time
  fetchUnreadOnStart: false, // use it only if you want to get all unread email on lib start. Default is `false`,
  attachments: false, // download attachments as they are encountered to the project directory
  attachmentOptions: { directory: "attachments/" }, //
};

const mailListener = new MailListener(mailOptions);

mailListener.start();
mailListener.on("server:connected", function () {
  console.log("imapConnected");
});

mailListener.on("mailbox", function (mailbox) {
  console.log("Total number of mails: ", mailbox.messages.total); // this field in mailbox gives the total number of emails
});

mailListener.on("server:disconnected", function () {
  console.log("imapDisconnected");
});

mailListener.on("error", function (err) {
  console.log(err);
});

// mailListener.on("headers", function (headers, seqno) {
//   // do something with headers
// });
//
// mailListener.on("body", function (body, seqno) {
//   // console.log(`Email#${seqno} body: `, body);
// });
//
// mailListener.on("attachment", function (attachment, path, seqno) {
//   // do something with attachment
// });

mailListener.on("mail", async function (mail, seqno) {
  // do something with the whole email as a single object
  if (mail.subject.toLowerCase().startsWith("notionmail")) {
    const subject = `${mail.subject.replace("notionmail", "").trim()}`;
    const text = mail.text;

    try {
      const response = await notion.pages.create({
        parent: {
          database_id: process.env.DATABASE_ID,
        },
        properties: {
          Title: {
            type: "title",
            title: [
              {
                type: "text",
                text: {
                  content: subject,
                },
              },
            ],
          },
        },
        children: [
          {
            object: "block",
            bulleted_list_item: {
              rich_text: [
                {
                  text: {
                    content: text,
                  },
                },
              ],
            },
          },
        ],
      });
      console.log(response);
      console.log("Email successfully sent to Notion");
    } catch (error) {
      console.error(error);
    }
  }
});
