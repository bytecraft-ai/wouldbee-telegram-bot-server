export const welcomeMessage = `Hi, I am Would Bee Matrimony bot! To avail my services, please register by sharing your phone number and bio-data. I will then share with you the bio-data of your "Would Bees" (prospective matches) regularly. Similarly, your bio-data will be shared with them. 

 - By using this service, you agree to our terms of use, available on www.wouldbee.com

 - To get started, please type or click on /register`;


export const helpMessage = `Hi there. You can use the following commands to avail my services -

/register - registers you for the Would Bee matrimony service. During the registration process, you will be asked for your phone number, bio-data and a profile picture.

/upload_bio - uploads your bio-data. You can use it to update or change your bio_data after registration.

/upload_picture - uploads your profile picture. You can use it to update or change your profile picture after registration.

/status - tells you your registration status (pending, complete, verified) and what to do if pending. 

/pause - pause sending you profiles and your profile to your matches. Does not delete your profile.

/resume - start sending you profiles and your profile to your matches again.

/delete - delete your Would Bee account. Stop sending you profiles and stop sending others your profile. This action is irreversible.


-- The below features will be released soon --

/support - to get support or give feedback.

/preference - set your partner preference to fine-tune the matches you receive.

/preview - shows you how your profile looks when sent to others.
`
// /get_app - get the download link to our 


/**
 * Notification Messages
 */

export const registrationCancelled = `Registration cancelled`;


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


export const unregisteredUserMsg = `You are not registered! To upload bio-data or profile picture, you need to register first. To register, please type or click on /register_me command. To see the list of all available commands, use /help command.`;


export const unsupportedPictureFormat = `Error: Only 'jpg' and 'png' formats are accepted for profile pictures. Please retry with supported format or type "Cancel" to quit.`;


export const unsupportedBioFormat = `Error: Only 'pdf' and MS-Word files('docx' and 'doc') are supported for bio-data. Please retry with supported format or type "Cancel" to quit.`;


export const supportMsg = `Please write your query or feedback (min 20 characters) or type Cancel to quit.`;