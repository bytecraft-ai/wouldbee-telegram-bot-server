export const welcomeMessage = `Hi, I am Would Bee Matrimony bot (a computer program, not a real person)! To avail my services, please register your profile by sharing your phone number, bio-data, and profile picture. I will then share with you the profiles of your "Would Bees" (prospective matches) regularly. Similarly, your profile will be shared with them. 

 - By using this service, you agree to our terms of use, available on www.wouldbee.com

 - To see this message again, use (type or click on) /start command

 - To create your profile with us, use /register command
 
 - To see how to interact with Would Bee bot, use the /help command.`;


export const helpMessage = `Hi there. I am Would Bee Matrimony bot. As I am not a real person, you can only interact with me through a set of commands. A command starts with the forward slash (/). You can use the following commands to avail my services -

/register - registers you for the Would Bee matrimony service. During the registration process, you will be asked for your phone number, bio-data and a profile picture.

/update_bio - upload new/updated bio-data. You can use it to update your bio_data up to five times after registration. Every update will be verified by us.

/update_picture - upload new/updated profile picture. You can use it to update your profile picture up to five times after registration. Every update will be verified by us.

/status - show your registration status (pending, complete, verified) and optionally, if any action is required from you. 

/deactivate - temporarily pause sending you profiles of your matches and your profile to them. Does not delete your profile.

/reactivate - start sending you profiles and your profile to your matches again.

/delete - delete your Would Bee account. First it marks your profile for deletion and deactivates your profile for a week. During this week, if you wish to reinstate your account, you can use /recover command. Otherwise, after a week, your account is permanently & irreversibly deleted.

/recover - cancel deletion of your Would Bee account. Only works before the account has been deleted.

/support - to get support or give feedback.`;

// -- The below features will be released soon

// /preference - set your partner preference to fine-tune the matches you receive.

// /preview - show how your profile looks when sent to others.

// /get_app - get the download link to our 
// `;


/**
 * Notification Messages
 */

export const registrationCancelled = `Registration cancelled. Use /register command to start registration process again or use /help command to see how to interact with the Would Bee bot.`;


export const askForBioUploadMsg = `Upload your bio-data (in PDF or MS-Word format) or use /cancel to quit.
 - Your bio-data must have the phone number you used to register with us, otherwise it will fail verification.`;


export const bioCreateSuccessMsg = `Success! Your bio-data has been saved!` // You can update it anytime using the /update_bio command.
// - Now our agent will manually verify your bio-data, which may a take a couple of days. Once verified, you will start receiving profiles.`


export const bioUpdateSuccessMsg = `Success! Your bio-data has been saved!`;
// - Your updated bio-data will be used after manual verification. We will let you know when it is verified`


export const pictureCreateSuccessMsg = `Success! Your profile picture has been saved!` //You can update it anytime using the /update_picture command.` Note that your picture will be manually verified before being sent to your matches.`


export const pictureUpdateSuccessMsg = `Success! Your profile picture has been saved!` //You can update it anytime using the /update_picture command. Note that your picture will be manually verified before being sent to your matches.`


export const registrationSuccessMsg = `Thank you for registering. Your bio-data and profile picture will now be verified by our verification team which may take a couple of days. Once verified, we will notify you and you will start receiving profiles of your matches.`;


// Warning Messages
export const alreadyRegisteredMsg = `You are already registered! If you'd like to update your profile picture or bio, you can use /update_picture and /update_bio commands respectively. To see the list of all available commands, use /help command.`;


// Error Messages
export const fatalErrorMsg = `Some error occurred. We have notified our engineers and it will be fixed soon. Please try again later!`;


export const unregisteredUserMsg = `You are not registered! This action requires you to register first using /register command. To see the list of all available commands, use /help command.`;


export const inactiveUserMsg = `Your profile is not active! This action requires you to first activate your profile. To do that use the /status command and then follow the steps suggested. `;


export const unsupportedPictureFormat = `Error: Only 'jpg' and 'png' formats are accepted for profile pictures. 
Please retry with supported format or use /cancel to quit.`;


export const unsupportedBioFormat = `Error: Only 'pdf' and MS-Word files('docx' and 'doc') are supported for bio-data. 
Please retry with supported format or use /cancel to quit.`;


export const supportMsg = `Please write your query or feedback (min 20 characters) or use /cancel to quit.`;


export const deletionSuccessMsg = `Alright! We have deactivated your profile for a week, after which it will be deleted permanently. In case you change your mind within a week, you can use /recover command to reactivate your profile and cancel deletion. Note that once deleted, your profile will cannot be recovered. `;


export const acknowledgeDeletionRequest = 'Sure. Kindly choose reason for deletion from below options. This will help us make our service better.';