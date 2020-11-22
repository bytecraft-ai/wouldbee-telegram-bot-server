export enum S3Option {
    GET = 1,
    PUT
}


export enum ProfileDeactivationDuration {
    ONE_WEEK = 1,
    TWO_WEEKS,
    ONE_MONTH,
    TWO_MONTHS,
    INDEFINITELY,
}


export enum ProfileSharedWith {
    NONE = 1,
    MALE,
    FEMALE,
    BOTH,
}


export enum Referee {
    USER = 1,
    AGENT,
    WEBSITE,
    NONE
}


export enum RegistrationActionRequired {
    VERIFY_PHONE = 1,
    UPLOAD_BIO,
    UPLOAD_BIO_AND_PICTURE,     // at this position, it has continuity with both picture and bio.
    UPLOAD_PICTURE,
    NONE
}


export enum UserStatus {
    UNREGISTERED = 1,
    PHONE_VERIFIED,
    UNVERIFIED, // bio verification pending
    VERIFICATION_FAILED,
    VERIFIED,   // bio approved
    ACTIVATED,  // profile created
    DEACTIVATED,
    PENDING_DELETION,
    DELETED,
    BANNED,
}


export enum SupportTicketCategory {
    TECHNICAL_ISSUE = 1,
    OTHER_ISSUE,
    GOOD_FEEDBACK,
    BAD_FEEDBACK
}


// export enum RegistrationStatus {
//     UNREGISTERED = 1,
//     PHONE_VERIFIED,
//     BIO_UPLOADED,
//     PICTURE_UPLOADED,
// }


export enum UserRole {
    USER = 1,
    ADMIN,
    AGENT
}


export enum Gender {
    MALE = 1,
    FEMALE,
}


export enum TypeOfIdProof {
    AADHAR = 1,
    DRIVING_LICENSE,
    PAN,
    PASSPORT,
    VOTER_ID,
}


export enum Religion {
    HINDU = 1,
    JAIN_DASH_DIGAMBER,
    JAIN_DASH_SHWETAMBER,
    MUSLIM_DASH_SHIA,
    MUSLIM_DASH_SUNNI,
    CHRISTIAN,
    SIKH,
}


export enum MaritalStatus {
    NEVER_MARRIED = 1,
    DIVORCED,
    WIDOWED,
    ANULLED,
    AWAITING_DIVORCE, // 5
}


export enum Mangalik {
    NON_MANGLIK = 1,
    MANGLIK,
    ANGSHIK,
    DO_NOT_KNOW,
}


export enum EmployedIn {
    PRIVATE_SECTOR = 1,
    PUBLIC_SECTOR,
    CIVIL_SERVICES,
    DEFENCE,
    BUSINESS_OR_SELF_EMPLOYED, //5
    NOT_WORKING,
}


export enum EducationDegree {
    LESS_THAN_HIGH_SCHOOL = 1,
    HIGH_SCHOOL,
    ASSOCIATES_DEGREE,
    TRADE_SCHOOL,
    DIPLOMA, // 5
    UNDER_GRADUATE,
    BACHELORS,
    MASTERS,
    DOCTORATE, // 9
    // HONOURS_DEGREE,
}


export enum Occupation {
    // -- Administration --
    ADMIN_PROFESSIONAL = 1,
    CLERK,
    OPERATOR_OR_TECHNICIAN,
    SECRETARY_OR_FRONT_OFFICE,

    // -- Advertising, Media & Entertainment --
    ACTOR_OR_MODEL, // 5
    ADVERTISING_PROFESSIONAL,
    FILM_OR_ENTERTAINMENT_PROFESSIONAL,
    JOURNALIST,
    MEDIA_PROFESSIONAL,
    PR_PROFESSIONAL,

    // -- Agricultural --
    AGRICULTURE_PROFESSIONAL, // 11
    FARMING,

    // -- Airline & Aviation --
    AIRLINE_PROFESSIONAL, // 13
    FLIGHT_ATTENDANT,
    PILOT,

    // -- Architecture --
    ARCHITECT, // 16

    // -- Armed Forces --
    AIR_FORCE, // 17
    ARMY,
    OTHER_DEFENCE_SERVICES,
    NAVY,

    // -- BPO & Customer Service --
    BPO_OR_ITES_PROFESSIONAL, // 21 
    CUSTOMER_SERVICE,

    // -- Banking & Finance --
    ACCOUNTING_PROFESSIONAL,  // 23
    AUDITOR,
    BANKING_PROFESSIONAL,
    CHARTERED_ACCOUNTANT,
    FINANCE_PROFESSIONAL,

    // -- Civil Services --
    CIVIL_SERVICES_IAS_OR_IPS_OR_IRS_OR_IES_OR_IFS,  // 28

    // -- Corporate Management Professionals --
    ANALYST,  // 29
    CONSULTANT,
    CORPORATE_COMMUNICATION,
    CORPORATE_PLANNING,
    HR_PROFESSIONAL,
    MARKETING_PROFESSIONAL,
    OPERATIONS_MANAGEMENT,   // 35
    PRODUCT_MANAGER,
    PROGRAM_MANAGER,
    PROJECT_MANAGER_DASH_IT,
    PROJECT_MANAGER_DASH_NON_IT,
    SALES_PROFESSIONAL,   // 40
    SR_MANAGER_OR_MANAGER,
    SUBJECT_MATTER_EXPERT,

    // -- Education & Training --
    // -- Science & Research --
    EDUCATION_PROFESSIONAL,
    EDUCATIONAL_INSTITUTION_OWNER,
    LIBRARIAN,  // 45
    PROFESSOR_OR_LECTURER,
    RESEARCH_PROFESSIONAL,
    RESEARCH_ASSISTANT,
    PHD_STUDENT_ON_STIPEND,
    SCIENTIST, // 50
    TEACHER,

    // -- Engineering --
    ELECTRONICS_ENGINEER,
    HARDWARE_OR_TELECOM_ENGINEER,
    NON_DASH_IT_ENGINEER,
    QUALITY_ASSURANCE_ENGINEER,  // 55

    // -- Hospitality --
    HOTELS_OR_HOSPITALITY_PROFESSIONAL,  // 56

    // -- Law Enforcement --
    LAW_ENFORCEMENT_OFFICER,  // 57
    POLICE,

    // -- Legal --
    LAWYER_AND_LEGAL_PROFESSIONAL,  // 59

    // -- Merchant Navy --
    MARINER,   // 60
    MERCHANT_NAVAL_OFFICER,

    // -- Other Medical & Healthcare --
    // -- Doctor --
    DENTIST,  // 66
    DOCTOR,
    SURGEON,
    MEDICAL_OR_HEALTHCARE_PROFESSIONAL,
    NURSE,  // 70
    PARAMEDIC,
    PHARMACIST,
    PHYSIOTHERAPIST,
    PSYCHOLOGIST,
    VETERINARY_DOCTOR,  // 75

    // -- Software & IT --
    ANIMATOR,
    CYBER_OR_NETWORK_SECURITY,
    PROJECT_LEAD_DASH_IT,  // 78
    QUALITY_ASSURANCE_ENGINEER_DASH_IT,
    SOFTWARE_PROFESSIONAL,
    UI_OR_UX_DESIGNER,
    WEB_OR_GRAPHIC_DESIGNER,

    // -- Top Management --
    CXO_OR_CHAIRMAN_OR_PRESIDENT_OR_DIRECTOR,  // 83
    VP_OR_AVP_OR_GM_OR_DGM,

    // -- Others --
    AGENT,  // 85
    ARTIST,
    BEAUTICIAN,
    BROKER,
    BUSINESS_OWNER_OR_ENTREPRENEUR,
    BUSINESSPERSON,  // 90
    FASHION_DESIGNER,
    FITNESS_PROFESSIONAL,
    INTERIOR_DESIGNER,
    POLITICIAN,
    SECURITY_PROFESSIONAL,  // 95
    SINGER,
    SOCIAL_SERVICES_OR_NGO_OR_VOLUNTEER,
    SPORTSPERSON,
    TRAVEL_PROFESSIONAL,
    WRITER,    // 100

    // -- Not working --
    LOOKING_FOR_JOB,   // 62
    NOT_WORKING,
    RETIRED,
    STUDENT,

    OTHERS,
}


export enum Language {
    ASSAMESE = 1, // 1
    AWADHI,
    BENGALI,
    BHOJPURI,
    BODO, // 5
    DOGRI,
    ENGLISH,
    GARHWALI,
    GUJARATI,
    HARYANAVI,
    HIMACHALI,
    HINDI, // 12
    KANNADA,
    KASHMIRI,
    KONKANI,
    MAITHILI,
    MALAYALAM,
    MARATHI, // 18
    MARWARI,
    MEITEI,
    NEPALI,
    ODIA,
    PUNJABI,
    RAJASTHANI,
    SANSKRIT, // 25
    SANTALI,
    SIKKIMESE,
    SINDHI,
    TAMIL,
    TELUGU, // 30
    URDU,
    OTHER, // 38
}


export enum ReasonForProfileBan {
    OBSCENE_OR_OFFENSIVE_UPLOADS,
    FAKE_OR_FRAUD,
    BAD_BEHAVIOR_WITH_OTHER_CUSTOMER,
    BAD_BEHAVIOR_WITH_AGENT,
    OTHER,
}


export enum DocRejectionReason {
    NOT_A_BIO_DATA = 1,
    NOT_A_PROFILE_PICTURE,
    NOT_AN_ID_PROOF,
    MISSING_INFO,
    INVALID_CONTACT,
    OBSCENE_OR_OFFENSIVE,
    FAKE_OR_FRAUDULENT,
    OTHER,
}


export enum ProfileDeletionReason {
    Found_match_on_Would_Bee = 1,
    Found_match_elsewhere,
    Postponed_marriage_plan,
    // Unhappy
    Facing_technical_issue,
    Facing_privacy_issue,
    Need_to_update_profile,
    Getting_irrelevant_matches,
    Getting_repeated_matches,
    Getting_very_few_matches,
    Other,
    // System
    Ban
}


export enum AnnualIncome {
    ZERO = 1,
    FIFTY_K_OR_MORE,
    ONE_L_OR_MORE,
    TWO_L_OR_MORE,
    FIVE_L_OR_MORE,
    TEN_L_OR_MORE,
    TWENTY_L_OR_MORE,
    THIRTY_FIVE_L_OR_MORE,
    FIFTY_L_OR_MORE,
    SEVENTY_FIVE_L_OR_MORE,
    ONE_CR_OR_MORE,
    FIVE_CR_OR_MORE,
    TEN_CR_OR_MORE,
}


export enum TypeOfDocument {
    PICTURE = 1,
    VIDEO,
    ID_PROOF,
    BIO_DATA,
    REPORT_ATTACHMENT
}


// export enum UserStatOptions {
//     REGISTRATION_FAILURE = 1,
//     NEW,    // VALIDATION PENDING
//     VALID,
//     INVALID,
//     ACTIVE,
//     DEACTIVATED,
//     DELETED,
//     BANNED,
//     TOTAL,  // misleading - removes banned, deleted, registration_failures
// }


export const maleAgeList = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
    100, // 70 or more
];

export const femaleAgeList = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
    100, // 70 or more
];