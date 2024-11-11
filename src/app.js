// // src/app.js
// const { App } = require("@slack/bolt");
// const express = require("express");
// const slackEvents = require("./slackEvents");

// const app = express.Router();

// const slackApp = new App({
//   token: process.env.SLACK_BOT_TOKEN,
//   signingSecret: process.env.SLACK_SIGNING_SECRET,
// });

// slackApp.command("/approval-test", async ({ ack, body, client }) => {
//   await ack();

//   try {
//     await client.views.open({
//       trigger_id: body.trigger_id,
//       view: {
//         type: "modal",
//         callback_id: "approval_modal",
//         title: { type: "plain_text", text: "Request Approval" },
//         blocks: [
//           {
//             type: "input",
//             block_id: "approver",
//             label: { type: "plain_text", text: "Select Approver" },
//             element: {
//               type: "users_select",
//               action_id: "select_user",
//             },
//           },
//           {
//             type: "input",
//             block_id: "approval_text",
//             label: { type: "plain_text", text: "Approval Request" },
//             element: {
//               type: "plain_text_input",
//               multiline: true,
//               action_id: "approval_input",
//             },
//           },
//         ],
//         submit: { type: "plain_text", text: "Submit" },
//       },
//     });
//   } catch (error) {
//     console.error("Error opening modal:", error);
//   }
// });

// slackEvents(slackApp);

// (async () => {
//   await slackApp.start();
//   console.log("⚡️ Slack bot is running!");
// })();

// module.exports = app;



const express = require('express');
const { App } = require('@slack/bolt');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.use(express.json());

// Endpoint for the slash command
app.post('/approval-test', async (req, res) => {
  try {
    // Slack Request verification (optional)
    console.log('Received request:', req.body);
    if (req.body.token !== process.env.SLACK_VERIFICATION_TOKEN) {
      return res.status(400).send('Request verification failed');
    }

    // Open a modal with dropdown for approver and textarea for approval message
    const triggerId = req.body.trigger_id;

    // Fetch the list of users in the Slack workspace
    const members = await slackApp.client.users.list();

    const users = members.members.map((user) => ({
      text: {
        type: 'plain_text',
        text: user.real_name || user.name,
      },
      value: user.id,
    }));

    // Send a modal to the user with a dropdown for approver and textarea for the approval message
    await slackApp.client.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'approval_modal',
        title: {
          type: 'plain_text',
          text: 'Approval Request',
        },
        blocks: [
          {
            type: 'section',
            block_id: 'approver_section',
            text: {
              type: 'mrkdwn',
              text: 'Select an approver:',
            },
            accessory: {
              type: 'static_select',
              action_id: 'approver_select',
              placeholder: {
                type: 'plain_text',
                text: 'Choose an approver',
              },
              options: users,
            },
          },
          {
            type: 'section',
            block_id: 'approval_text_section',
            text: {
              type: 'mrkdwn',
              text: 'Provide approval text:',
            },
            accessory: {
              type: 'plain_text_input',
              action_id: 'approval_text_input',
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'Type your approval message here...',
              },
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Submit',
                },
                action_id: 'submit_approval',
                style: 'primary',
              },
            ],
          },
        ],
      },
    });

    // Respond with status 200 to acknowledge the slash command
    res.status(200).send();
  } catch (error) {
    console.error('Error opening modal:', error);
    res.status(500).send('Error handling the slash command');
  }
});

// Endpoint to handle the form submission from the modal
app.post('/submit-approval', async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const approverId = payload.view.state.values.approver_section.approver_select.selected_option.value;
  const approvalText = payload.view.state.values.approval_text_section.approval_text_input.value;

  // Send the approval request to the selected approver with buttons
  try {
    await slackApp.client.chat.postMessage({
      channel: approverId,
      text: `You have an approval request. Approval message: "${approvalText}"`,
      attachments: [
        {
          text: 'Do you approve?',
          fallback: 'You are unable to approve or reject.',
          actions: [
            {
              name: 'approve',
              text: 'Approve',
              type: 'button',
              value: 'approve',
              style: 'primary',
            },
            {
              name: 'reject',
              text: 'Reject',
              type: 'button',
              value: 'reject',
              style: 'danger',
            },
          ],
        },
      ],
    });

    res.status(200).send('Approval request sent to approver');
  } catch (error) {
    console.error('Error sending approval request:', error);
    res.status(500).send('Error handling the approval request');
  }
});

// Handle approval/rejection response
app.post('/handle-approval-response', async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const action = payload.actions[0].value;
  const approvalResponse = action === 'approve' ? 'approved' : 'rejected';

  // Notify the requester about the approval/rejection
  const requesterId = payload.user.id; // Assuming requester is the one who triggered the slash command

  try {
    await slackApp.client.chat.postMessage({
      channel: requesterId,
      text: `Your request has been ${approvalResponse} by the approver.`,
    });

    res.status(200).send('Approval response sent');
  } catch (error) {
    console.error('Error sending approval response:', error);
    res.status(500).send('Error handling the approval response');
  }
});

// Start the server
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${server.address().port}`);
});

module.exports = app;
