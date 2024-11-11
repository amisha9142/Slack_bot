// src/app.js
const { App } = require("@slack/bolt");
const express = require("express");
const slackEvents = require("./slackEvents");

const app = express.Router();

const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

slackApp.command("/approval-test", async ({ ack, body, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        callback_id: "approval_modal",
        title: { type: "plain_text", text: "Request Approval" },
        blocks: [
          {
            type: "input",
            block_id: "approver",
            label: { type: "plain_text", text: "Select Approver" },
            element: {
              type: "users_select",
              action_id: "select_user",
            },
          },
          {
            type: "input",
            block_id: "approval_text",
            label: { type: "plain_text", text: "Approval Request" },
            element: {
              type: "plain_text_input",
              multiline: true,
              action_id: "approval_input",
            },
          },
        ],
        submit: { type: "plain_text", text: "Submit" },
      },
    });
  } catch (error) {
    console.error("Error opening modal:", error);
  }
});

slackEvents(slackApp);

(async () => {
  await slackApp.start();
  console.log("⚡️ Slack bot is running!");
})();

module.exports = app;

