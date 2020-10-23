export enum UserRole {
    USER = 1,
    ADMIN,
    AGENT
}


export enum Gender {
    MALE = 1,
    FEMALE,
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


export enum AccountDeletionReason {
    FOUND_MATCH_HERE = 1,
    FOUND_MATCH_ELSEWHERE_FAMILY,
    FOUND_MATCH_ELSEWHERE_FRIENDS,
    FOUND_MATCH_ELSEWHERE_NEWSPAPER,
    FOUND_MATCH_ELSEWHERE_WEB_SHAADI,
    FOUND_MATCH_ELSEWHERE_WEB_JEEVANSATHI,
    FOUND_MATCH_ELSEWHERE_WEB_BHARAT,
    FOUND_MATCH_ELSEWHERE_WEB_OTHER,
    POSTPONED_MARRIAGE_PLAN,
    NEED_TO_CHANGE_PROFILE,
    PRIVACY_ISSUE,
    UNHAPPY_WITH_SERVICE_GETTING_IRRELEVANT_MATCHES,
    UNHAPPY_WITH_SERVICE_GETTING_REPEATED_MATCHES,
    UNHAPPY_WITH_SERVICE_GETTING_FEW_MATCHES_OR_RESPONSES,
    UNHAPPY_WITH_SERVICE_FACING_TECHNICAL_ISSUE,
    UNHAPPY_WITH_SERVICE_GETTING_TOO_MANY_CALLS_OR_MAILS,
    UNHAPPY_WITH_SERVICE_GETTING_TOO_MANY_APP_NOTIFICATIONS,
    OTHER
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


export const maleAgeList = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
    100, // 70 or more
];

export const femaleAgeList = [18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
    100, // 70 or more
];