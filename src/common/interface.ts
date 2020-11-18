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


export interface IUserStats {
    total: number;
    male?: number;
    female?: number;
}