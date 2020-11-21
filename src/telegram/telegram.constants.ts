export const welcomeMessage = `Hi, I am Would Bee Matrimony bot! To avail my services, please register your profile by sharing your phone number, bio-data, and profile picture. I will then share with you the profiles of your "Would Bees" (prospective matches) regularly. Similarly, your profile will be shared with them. 

 - By using this service, you agree to our terms of use, available on www.wouldbee.com

 - To get started, please type or click on /register
 
 - To see how to interact with Would Bee bot, use the /help command.`;


export const helpMessage = `Hi there. You can use the following commands to avail my services -

/register - registers you for the Would Bee matrimony service. During the registration process, you will be asked for your phone number, bio-data and a profile picture.

/upload_bio - uploads your bio-data. You can use it to update or change your bio_data up to five times after registration. Every update of bio-data will be verified by us.

/upload_picture - uploads your profile picture. You can use it to update or change your profile picture up to five times after registration. Every update of picture will be verified by us.

/status - tells you your registration status (pending, complete, verified) and if any  action is required from you. 

/deactivate - temporarily pause sending you profiles of your matches and your profile to them. Does not delete your profile.

/reactivate - start sending you profiles and your profile to your matches again.

/delete - delete your Would Bee account. First it marks your profile for deletion and deactivates your profile for a week. During this week, if you wish to reinstate your account, you can use /recover command. Otherwise, after a week, your account is permanently & irreversibly deleted.

/recover - cancel deletion of your Would Bee account. Only works before the account has been deleted.

/support - to get support or give feedback.

-- The below features will be released soon

/preference - set your partner preference to fine-tune the matches you receive.

/preview - shows you how your profile looks when sent to others.
`;
// /get_app - get the download link to our 


/**
 * Notification Messages
 */

export const registrationCancelled = `Registration cancelled. Use /register command to start registration process again or use /help command to see how to interact with the Would Bee bot.`;


export const askForBioUploadMsg = `Upload your bio-data or type Cancel to quit.
 - Your bio-data should have the same phone number you used to register with us, otherwise it will fail the verification process.`;


export const bioCreateSuccessMsg = `Success! Your bio-data has been saved!` // You can update it anytime using the /upload_bio command.
// - Now our agent will manually verify your bio-data, which may a take a couple of days. Once verified, you will start receiving profiles.`


export const bioUpdateSuccessMsg = `Success! Your bio-data has been saved!`;
// - Your updated bio-data will be used after manual verification. We will let you know when it is verified`


export const pictureCreateSuccessMsg = `Success! Your profile picture has been saved!` //You can update it anytime using the /upload_picture command.` Note that your picture will be manually verified before being sent to your matches.`


export const pictureUpdateSuccessMsg = `Success! Your profile picture has been saved!` //You can update it anytime using the /upload_picture command. Note that your picture will be manually verified before being sent to your matches.`


export const registrationSuccessMsg = `Thank you for registering. Your bio-data and profile picture will now be verified by our fraud prevention team which may take a couple of days. Once verified, we will notify you and you will start receiving profiles of your matches.`;


// Warning Messages
export const alreadyRegisteredMsg = `You are already registered! If you'd like to update your profile picture or bio, you can use /upload_picture and /upload_bio commands respectively. To see the list of all available commands, use /help command.`;


// Error Messages
export const fatalErrorMsg = `Some error occurred. We have notified our engineers and it will be fixed soon. Please try again later!`;


export const unregisteredUserMsg = `You are not registered! To upload bio-data or profile picture, you need to register first. To register, please type or click on /register command. To see the list of all available commands, use /help command.`;


export const unsupportedPictureFormat = `Error: Only 'jpg' and 'png' formats are accepted for profile pictures. Please retry with supported format or type "Cancel" to quit.`;


export const unsupportedBioFormat = `Error: Only 'pdf' and MS-Word files('docx' and 'doc') are supported for bio-data. Please retry with supported format or type "Cancel" to quit.`;


export const supportMsg = `Please write your query or feedback (min 20 characters) or type Cancel to quit.`;


export const deletionSuccessMsg = `Alright! We have deactivated your profile for a week, after which it will be deleted permanently. In case you change your mind within a week, you can use /recover command to reactivate your profile and cancel deletion. Note that once deleted, your profile will cannot be recovered. `;


export const acknowledgeDeletionRequest = 'Sure. Kindly choose reason for deletion from below options. This will help us make our service better.';