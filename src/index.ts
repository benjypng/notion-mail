import { MailListener } from 'mail-listener5';
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN as string,
});

const mailOptions = {
  username: process.env.EMAIL as string,
  password: process.env.PW as string,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  connTimeout: 10000, // Default by node-imap
  authTimeout: 5000, // Default by node-imap,
  debug: console.log, // Or your custom function with only one incoming argument. Default: null
  autotls: 'never', // default by node-imap
  keepalive: {
    interval: 10000,
    idleinterval: 300000,
    forceNoop: true,
  },
  tlsOptions: { rejectUnauthorized: false },
  mailbox: 'INBOX', // mailbox to monitor
  searchFilter: ['SEEN', ['X-GM-LABELS', 'notion-mail']], // Filter based on your label name
  markSeen: true, // all fetched email willbe marked as seen and not fetched next time
  fetchUnreadOnStart: false, // use it only if you want to get all unread email on lib start. Default is `false`,
  attachments: false, // download attachments as they are encountered to the project directory
  attachmentOptions: { directory: 'attachments/' },
};

const mailListener = new MailListener(mailOptions);

mailListener.on('server:connected', () => {
  console.log('imapConnected');
});

//mailListener.on('mailbox', (mailbox) => {
//  console.log('Total number of mails: ', mailbox.messages.total); // this field in mailbox gives the total number of emails
//});

//mailListener.on('server:disconnected', () => {
//  console.log('imapDisconnected');
//});

//mailListener.on('error', (err) => {
//  console.log(err);
//});

//@ts-ignore
mailListener.on('mail', async (mail, _seqno) => {
  // do something with the whole email as a single object
  const mailTime = Math.floor(Date.parse(mail.date) / 1000);
  const currentTime = Math.floor(Date.now() / 1000);
  if (currentTime - mailTime > 10) return;

  if (/(\b[nN][mM]\b)/.exec(mail.subject)) {
    // NOTE: This filter may be a little redundant because it is being done in Gmail
    const subject = mail.subject.replace(/(\b[nN][mM]\b)/, '').trim();
    const text = mail.text;

    try {
      await notion.pages.create({
        parent: {
          database_id: process.env.DATABASE_ID as string,
        },
        properties: {
          Name: {
            type: 'title',
            title: [
              {
                type: 'text',
                text: {
                  content: subject,
                },
              },
            ],
          },
        },
        children: [
          {
            object: 'block',
            paragraph: {
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
      console.log('Email successfully sent to Notion');
    } catch (error) {
      console.error(error);
    }
  }
});

mailListener.start();
