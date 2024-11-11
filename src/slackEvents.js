// src/slackEvents.js
module.exports = (slackApp) => {
    // Handle modal submission
    slackApp.view("approval_modal", async ({ ack, body, view, client }) => {
      await ack();
  
      const approverId = view.state.values.approver.select_user.selected_user;
      const approvalText = view.state.values.approval_text.approval_input.value;
      const requesterId = body.user.id;
  
      try {
        // Send the approval request to the approver
        await client.chat.postMessage({
          channel: approverId,
          text: `*Approval Request from <@${requesterId}>*:\n${approvalText}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Approval Request from <@${requesterId}>:*\n${approvalText}`,
              },
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "Approve" },
                  value: requesterId,
                  action_id: "approve_request",
                },
                {
                  type: "button",
                  text: { type: "plain_text", text: "Reject" },
                  value: requesterId,
                  action_id: "reject_request",
                },
              ],
            },
          ],
        });
      } catch (error) {
        console.error("Error sending approval request:", error);
      }
    });
  
    // Handle Approve button click
    slackApp.action("approve_request", async ({ ack, body, client }) => {
      await ack();
      const requesterId = body.actions[0].value;
  
      try {
        await client.chat.postMessage({
          channel: requesterId,
          text: "Your approval request has been approved! 🎉",
        });
      } catch (error) {
        console.error("Error notifying requester of approval:", error);
      }
    });
  
    // Handle Reject button click
    slackApp.action("reject_request", async ({ ack, body, client }) => {
      await ack();
      const requesterId = body.actions[0].value;
  
      try {
        await client.chat.postMessage({
          channel: requesterId,
          text: "Your approval request has been rejected.",
        });
      } catch (error) {
        console.error("Error notifying requester of rejection:", error);
      }
    });
  };
  