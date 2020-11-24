export interface JwtPayload {
    username: string
}


export interface FailOption {
    throwOnFail: boolean;
}


export interface CommonData {
    maleAgeList: number[];
    femaleAgeList: number[];
}


export interface IList<T> {
    count: number;
    values: Array<T>;
}


export interface IDocumentStatus {
    valid?: boolean;
    active?: boolean;
}

// export interface IUserCount {
//     total: number;
//     male?: number;
//     female?: number;
// }

// export interface IUserStats {
//     total: IUserCount;
//     unregistered: IUserCount;
//     new: IUserCount;
//     pending_updates: IUserCount;
//     deactivated: IUserCount;
//     banned: IUserCount;
// }

// interface IUserStats extends Record<string, number> { }