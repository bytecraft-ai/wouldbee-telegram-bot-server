import { Injectable, UnauthorizedException, Logger, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { femaleAgeList, Gender, maleAgeList, Referee, Religion, TypeOfDocument, TypeOfIdProof, RegistrationStatus } from 'src/common/enum';
import { deDuplicateArray, getAgeInYearsFromDOB, setDifferenceFromArrays } from 'src/common/util';
import { Repository } from 'typeorm';
// import { TelegramAuthenticateDto } from './dto/telegram-auth.dto';
import { PartnerPreferenceDto, CreateUserDto, CreateProfileDto, RegistrationDto } from './dto/profile.dto';
import { Caste } from './entities/caste.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { PartnerPreference } from './entities/partner-preference.entity';
import { Profile } from './entities/profile.entity';
import { State } from './entities/state.entity';
// import { User } from './entities/user.entity';
import { GetAllDocumentsOption, GetCityOptions, GetStateOptions, GetTelegramProfilesOption } from './profile.interface';
import { createHash, createHmac } from 'crypto';
import { TelegramProfile } from './entities/telegram-profile.entity';
import { SharedProfile } from './entities/shared-profiles.entity';
import { AwsService } from 'src/aws-service/aws-service.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { CommonData, IList } from 'src/common/interface';
import { Document } from './entities/document.entity';
import { isUUID } from 'class-validator';
import { AgentService } from 'src/agent/agent.service';
import { Agent } from 'src/agent/entities/agent.entity';
// import { assert } from 'console';
// import { InvalidDocument } from './entities/invalid-document.entity';
// import { AwsDocument } from './entities/aws-document.entity';
import { isNil } from 'lodash';

const logger = new Logger('ProfileService');

@Injectable()
export class ProfileService {
    constructor(
        private readonly awsService: AwsService,
        private readonly agentService: AgentService,
        // @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Profile) private profileRepository: Repository<Profile>,
        @InjectRepository(TelegramProfile) private telegramRepository: Repository<TelegramProfile>,
        @InjectRepository(SharedProfile) private sharedProfileRepository: Repository<SharedProfile>,
        @InjectRepository(PartnerPreference) private prefRepository: Repository<PartnerPreference>,

        @InjectRepository(Document) private documentRepository: Repository<Document>,
        // @InjectRepository(AwsDocument) private awsDocumentRepository: Repository<AwsDocument>,
        // @InjectRepository(InvalidDocument) private invalidDocumentRepository: Repository<InvalidDocument>,

        @InjectRepository(Caste) private casteRepository: Repository<Caste>,
        @InjectRepository(City) private cityRepository: Repository<City>,
        @InjectRepository(State) private stateRepository: Repository<State>,
        @InjectRepository(Country) private countryRepository: Repository<Country>,
    ) { }


    // checkTelegramAuth(auth: TelegramAuthenticateDto): boolean {
    //     if (!process.env.BOT_TOKEN) {
    //         throw new InternalServerErrorException('Telegram Bot token is not set!');
    //     }
    //     console.log('auth:', JSON.stringify(auth));
    //     const now = Date.now() / 1000;
    //     const timeDiff = now - parseInt(auth.auth_date);
    //     console.log('now:', now, 'timeDiff:', timeDiff);

    //     const checkString: string = Object.keys(auth)
    //         .filter(key => key !== 'hash')
    //         .map(key => `${key}=${auth[key]}`)
    //         .sort()
    //         .join('\n');

    //     const secret = createHash('sha256')
    //         .update(process.env.BOT_TOKEN)
    //         .digest();

    //     const hash = createHmac('sha256', secret)
    //         .update(checkString)
    //         .digest('hex');

    //     return auth.hash === hash; // && timeDiff < constants.telegram.authExpiresIn;
    // }


    // async sendMessage(): Promise<boolean> {
    //     return true;
    // }


    // async getUsers(): Promise<User[] | undefined> {
    //     return this.userRepository.find();
    // }


    // async getUserByPhone(phone: string, throwOnFail = true): Promise<User | undefined> {
    //     // const user = await this.userRepository.findOne({
    //     //     where: { phone: phone }
    //     // });
    //     // if (throwOnFail && !user) {
    //     //     throw new NotFoundException(`user with phone: ${phone} not found!`);
    //     // }
    //     // return user;

    //     const user = await this.userRepository.createQueryBuilder("user")
    //         .leftJoinAndSelect("user.country", 'country')
    //         .where("country.phoneCode || user.phone LIKE :phone",
    //             { phone }).getOne();
    //     // .orWhere("user.phone LIKE :phone",
    //     //     { phone: `phone` }).getOne();
    //     if (throwOnFail && !user) {
    //         throw new NotFoundException(`user with phone: ${phone} not found!`);
    //     }
    //     return user;
    // }


    // async getUser(id: string, throwOnFail = true): Promise<User | undefined> {
    //     const user = await this.userRepository.findOne(id);
    //     if (throwOnFail && !user) {
    //         throw new NotFoundException('user not found!');
    //     }
    //     return user;
    // }


    // async createUser(userInput: CreateUserDto): Promise<User | undefined> {
    //     const { email, phone, countryId } = userInput;

    //     let country: Country;
    //     if (!countryId) {
    //         country = await this.getCountryByName('India', true);
    //     } else {
    //         country = await this.getCountry(countryId, true);
    //     }

    //     console.log('country:', country);

    //     let user = await this.userRepository.findOne({
    //         where: [
    //             { email: email },
    //             { phone: phone }
    //         ]
    //     });
    //     if (user) {
    //         throw new ConflictException('user with email/phone already exists!');
    //     }

    //     user = this.userRepository.create({
    //         email,
    //         country,
    //         phone
    //     });
    //     return this.userRepository.save(user);
    // }


    async createProfile(profileDto: CreateProfileDto): Promise<Profile | undefined> {
        const { userId, name, gender, dob, religion, casteId, annualIncome, cityId, highestDegree, employedIn, occupation, motherTongue, maritalStatus } = profileDto;
        let profile = await this.profileRepository.findOne(userId);
        if (profile) {
            throw new
                ConflictException('profile already exists!');
        }
        const caste = await this.getCaste(casteId, true);
        const city = await this.getCity(cityId, { throwOnFail: true });
        profile = this.profileRepository.create({
            id: userId,
            name,
            gender,
            dob,
            religion,
            caste,
            annualIncome,
            city
        })
        return this.profileRepository.save(profile);
    }


    async getProfiles(): Promise<Profile[] | undefined> {
        return this.profileRepository.find();
    }


    async getProfile(id: string, throwOnFail = true): Promise<Profile | undefined> {
        const profile = await this.profileRepository.findOne(id);
        if (throwOnFail && !profile) {
            throw new NotFoundException(`Profile with id: ${id} not found`);
        }
        return profile;
    }


    async getPreference(id: string, throwOnFail = true): Promise<PartnerPreference | undefined> {
        const preference = await this.prefRepository.findOne(id);
        if (throwOnFail && !preference) {
            throw new NotFoundException(`Preference with id: ${id} not found`);
        }
        return preference;
    }


    async getPreferences(): Promise<PartnerPreference[] | undefined> {
        return this.prefRepository.find();
    }


    async savePartnerPreference(preferenceInput: PartnerPreferenceDto): Promise<PartnerPreference> {
        let { id, minAge, maxAge, religions, casteIds, minimumIncome, cityIds, stateIds, countryIds } = preferenceInput;
        const profile = await this.getProfile(id);

        let pref = await this.getPreference(id);
        if (!pref) {
            pref = this.prefRepository.create();
        }

        const age = getAgeInYearsFromDOB(profile.dob);
        if (!minAge) {
            minAge = profile.gender === Gender.MALE ? age - 6 : age - 1;
        }
        if (!maxAge) {
            maxAge = profile.gender === Gender.MALE ? age + 1 : age + 6
        }
        minAge = Math.min(profile.gender === Gender.MALE ? 21 : 18, minAge)
        maxAge = Math.max(profile.gender === Gender.MALE ? 21 : 18, maxAge)

        if (!religions?.length) religions = [profile.religion]
        if (!casteIds?.length) casteIds = [profile.casteId]

        const castes: Caste[] = [];
        for (let casteId of casteIds) {
            const caste = await this.getCaste(casteId, true);
            castes.push(caste);
        }

        const cities: City[] = [];
        for (let cityId of cityIds) {
            const city = await this.getCity(cityId, { throwOnFail: true });
            cities.push(city);
        }

        const states: State[] = [];
        for (let stateId of stateIds) {
            const state = await this.getState(stateId, { throwOnFail: true });
            states.push(state);
        }

        const countries: Country[] = [];
        for (let countryId of countryIds) {
            const country = await this.getCountry(countryId, true);
            countries.push(country);
        }

        pref.castes = castes;
        pref.cities = cities;
        pref.states = states;
        pref.countries = countries;

        pref.minAge = minAge;
        pref.maxAge = maxAge;
        pref.religions = religions;
        pref.minimumIncome = minimumIncome;
        pref.profile = profile;

        pref = await this.prefRepository.save(pref)

        logger.log(`saved preference for profile: ${JSON.stringify(profile)}`);
        logger.log(JSON.stringify(pref));

        return pref;
    }


    // @Transactional()
    // async register(rDto: RegistrationDto): Promise<User> {
    //     // set up transaction
    //     let user: User;
    //     try {
    //         const userInput: CreateUserDto = {
    //             email: rDto?.email,
    //             countryId: rDto?.countryId,
    //             phone: rDto.phone
    //         };
    //         user = await this.createUser(userInput);

    //         const profileInput: CreateProfileDto = {
    //             userId: user.id,
    //             name: rDto.name,
    //             gender: rDto.gender,
    //             dob: rDto.dob,
    //             religion: rDto.religion,
    //             casteId: rDto.casteId,
    //             annualIncome: rDto.annualIncome,
    //             cityId: rDto.cityId
    //         };
    //         const profile = await this.createProfile(profileInput);

    //         const preferenceInput: PartnerPreferenceDto = {
    //             id: user.id,
    //             minAge: rDto?.minAge,
    //             maxAge: rDto?.maxAge,
    //             religions: rDto?.religions,
    //             minimumIncome: rDto?.minimumIncome,
    //             cityIds: rDto?.cityIds,
    //             stateIds: rDto?.stateIds,
    //             countryIds: rDto?.countryIds,

    //         }
    //         const preference = await this.savePartnerPreference(preferenceInput);
    //     }
    //     catch (error) {
    //         logger.error(`ERROR: registration failed! Input: ${JSON.stringify(rDto)} \nError: ${error}`);
    //         throw error;
    //     }
    //     return user;
    // }


    async createTelegramProfile(telegramChatId: number, telegramUserId: number, phone?: string): Promise<TelegramProfile | undefined> {
        if (!telegramUserId || !telegramChatId) {
            throw new BadRequestException('Requires non empty telegramUserId and chatId');
        }
        let telegramProfile = await this.telegramRepository.findOne({
            where: [
                { phone },//: (phone ? phone: 'dummy') },
                { telegramUserId },
                { telegramUserId }
            ]
        })
        if (!telegramProfile) {
            telegramProfile = this.telegramRepository.create({
                telegramChatId,
                telegramUserId,
                phone,
            })
            telegramProfile = await this.telegramRepository.save(telegramProfile);
            logger.log(`Created new telegram profile!`);
        } else {
            throw new ConflictException('Telegram profile already exists!');
        }

        // logger.log(`Returning telegram profile:`, JSON.stringify(telegramProfile));
        return telegramProfile;
    }


    async getTelegramProfiles(options?: GetTelegramProfilesOption, skip = 0, take = 20): Promise<IList<TelegramProfile> | undefined> {

        if (take < 1 || take > 100) {
            throw new Error('1 ≤ take ≥ 100');
        }

        const { isValid, withPhone, withBio, withPhoto, withIdProof } = options;
        const query = this.telegramRepository.createQueryBuilder('tel_profile');

        // TODO: Implement using INTERSECT clause within sub-queries and fix this.
        if (!isNil(withPhoto) || !isNil(withIdProof)) {
            throw new NotImplementedException('withPhoto and withIdProof options are not yet implemented!')
            /**
             * TODO: Refactor documents into separate tables - BioData, IdProof, 
             * Picture, etc. This will allow join to create a single row, e.g.
             * (id1, chatId1, phone1, idProof1, bio1, photo1)
             *  BUT if we have all docTypes in one document, then we get multi-row
             *  join for each id, e.g. (which is harder to query bcz of attributes
             *  being in separate rows.)
             *  [   
             *      (id2, chatId2, phone2, bio2),
             *      (id2, chatId2, phone2, photo2),
             *      (id2, chatId2, phone2, idProof2),
             *  ]
             */
        }

        if (!isNil(withBio) || !isNil(withPhoto) || !isNil(withIdProof))
            query.leftJoin('tel_profile.documents', 'document');

        if (!isNil(isValid))
            query.where('tel_profile.isValid = :isValid', { isValid });

        if (!isNil(withPhone) && withPhone === false)
            query.andWhere('tel_profile.phone IS NULL');
        else if (withPhone)
            query.andWhere('tel_profile.phone IS NOT NULL');

        if (withBio)
            query.andWhere('document.typeOfDocument = :docTypeBio', { docTypeBio: TypeOfDocument.BIO_DATA });
        else if (!isNil(withBio) && withBio === false) {
            query.andWhere(qb => {
                const subQuery = qb.subQuery()
                    .select("t_document.telegramProfileId")
                    .from(Document, "t_document")
                    .where("t_document.typeOfDocument = :docTypeBio")
                    .getQuery();
                return "tel_profile.id NOT IN " + subQuery;
            })
            query.setParameter("docTypeBio", TypeOfDocument.BIO_DATA);
        }

        // if (withPhoto)
        //     query.andWhere('document.typeOfDocument = :docTypePhoto', { docTypePhoto: TypeOfDocument.PICTURE });
        // else if (!isNil(withPhoto) && withPhoto === false) {
        //     query.andWhere(qb => {
        //         const subQuery = qb.subQuery()
        //             .select("t_document.telegramProfileId")
        //             .from(Document, "t_document")
        //             .where("t_document.typeOfDocument = :docTypePhoto")
        //             .getQuery();
        //         return "tel_profile.id NOT IN " + subQuery;
        //     })
        //     query.setParameter("docTypePhoto", TypeOfDocument.PICTURE);
        // }

        // if (withIdProof)
        //     query.andWhere('document.typeOfDocument = :docTypeId', { docTypeId: TypeOfDocument.ID_PROOF });
        // else if (!isNil(withIdProof) && withIdProof === false) {
        //     query.andWhere(qb => {
        //         const subQuery = qb.subQuery()
        //             .select("t_document.telegramProfileId")
        //             .from(Document, "t_document")
        //             .where("t_document.typeOfDocument = :docTypeId")
        //             .getQuery();
        //         return "tel_profile.id NOT IN " + subQuery;
        //     })
        //     query.setParameter("docTypeId", TypeOfDocument.ID_PROOF);
        // }

        const [telegramProfiles, count] = await query.skip(skip).take(take).getManyAndCount();

        return {
            count,
            values: telegramProfiles
        };
    }


    async getTelegramProfileById(id: string, { throwOnFail = true }): Promise<TelegramProfile | undefined> {
        const telegramProfile = await this.telegramRepository.findOne(id);
        if (throwOnFail && !telegramProfile) {
            throw new NotFoundException(`Telegram profile with id: ${id} not found!`);
        }
        return telegramProfile;
    }


    async getTelegramProfileByTelegramUserId(telegramUserId: number, { throwOnFail = true }): Promise<TelegramProfile | undefined> {
        const telegramProfile = await this.telegramRepository.findOne({
            where: { telegramUserId }
        });
        if (throwOnFail && !telegramProfile) {
            throw new NotFoundException(`Telegram profile with telegram user id: ${telegramUserId} not found!`);
        }
        return telegramProfile;
    }


    async getTelegramProfileByTelegramChatId(telegramChatId: number, { throwOnFail = true }): Promise<TelegramProfile | undefined> {
        const telegramProfile = await this.telegramRepository.findOne({
            where: { telegramChatId }
        });
        if (throwOnFail && !telegramProfile) {
            throw new NotFoundException(`Telegram profile with chat id: ${telegramChatId} not found!`);
        }
        return telegramProfile;
    }


    async savePhoneNumberForTelegramUser(id: string, phone: string): Promise<TelegramProfile | undefined> {
        if (!phone) {
            throw new Error("Phone number cannot be empty!");
        }
        let telegramProfile = await this.getTelegramProfileById(id, { throwOnFail: true });
        telegramProfile.phone = phone;
        return this.telegramRepository.save(telegramProfile);
    }


    async getAllDocuments(options?: GetAllDocumentsOption, skip = 0, take = 20): Promise<IList<Document> | undefined> {
        const { telegramProfileId, typeOfDocument } = options;
        const [values, count] = await this.documentRepository.findAndCount({
            where: { telegramProfileId },
            skip,
            take
        });

        return {
            count,
            values
        }
    }


    async getDocument(telegramProfileId: string, typeOfDocument: TypeOfDocument, { throwOnFail = false
    }): Promise<Document | undefined> {

        const document = await this.documentRepository.findOne({
            where: { id: telegramProfileId, typeOfDocument: typeOfDocument },
        });

        if (throwOnFail && !document) {
            throw new NotFoundException(`Document with id: ${telegramProfileId} and docType: ${typeOfDocument} does not exist!`);
        }

        return document;
    }


    @Transactional()
    async uploadDocument(telegramUserId: number, fileName: string, dir: string, contentType: string, typeOfDocument: TypeOfDocument, telegramFileId: string, typeOfIdProof?: TypeOfIdProof): Promise<Document | undefined> {
        try {
            const telegramProfile = await this.getTelegramProfileByTelegramUserId(telegramUserId, { throwOnFail: true });

            // let document = await this.getDocument(telegramProfile.id, typeOfDocument, { throwOnFail: false });

            let unverifiedDocument = await this.documentRepository.findOne({
                where: { id: telegramProfile.id, typeOfDocument: typeOfDocument, isValid: null },
            });

            // upload aws s3 document
            const url = await this.awsService.uploadFileToS3(telegramProfile.id, fileName, contentType, typeOfDocument, dir);

            let document = this.documentRepository.create({
                telegramProfileId: telegramProfile.id,
                typeOfDocument,
                typeOfIdProof,
                telegramFileId,
                fileName,
                url,
                mimeType: contentType
            });

            document = await this.documentRepository.save(document);

            // Now delete old unverified document from aws S3 and table
            if (unverifiedDocument) {

                // mark old unverified document as inactive;
                unverifiedDocument.active = false;
                unverifiedDocument.url = null;
                unverifiedDocument.fileName = null;
                unverifiedDocument.mimeType = null;

                // Save repo & delete file from aws
                await this.documentRepository.save(unverifiedDocument);
                await this.awsService.deleteFileFromS3(fileName, typeOfDocument);
            }

            return document;
        }
        catch (error) {
            logger.error(`Could not upload document. Error: ${error}`);
            throw error;
        }
    }


    async downloadDocument(telegramUserId: number, typeOfDocument: TypeOfDocument, dir: string): Promise<string | undefined> {

        const telegramProfile = await this.getTelegramProfileByTelegramUserId(telegramUserId, { throwOnFail: true });

        const document = await this.getDocument(telegramProfile.id, typeOfDocument, { throwOnFail: true });

        if (!document.fileName)
            throw new Error('This document does not exist on AWS!');

        return this.awsService.downloadFileFromS3(document.fileName, typeOfDocument, dir);
    }


    @Transactional()
    async verifyDocument(documentId: number, agent: Agent): Promise<Document | undefined> {
        try {
            let document = await this.documentRepository.findOne(documentId);

            if (!document) {
                throw new NotFoundException(`Document with id: ${documentId} does not exist!`);
            }

            // find current active document, mark as inactive and delete from AWS in the end
            const currentActiveDocument = await this.documentRepository.findOne({
                where: {
                    telegramProfileId: document.telegramProfileId,
                    typeOfDocument: document.typeOfDocument,
                    active: true
                }
            });
            currentActiveDocument.active = false;
            const currentActiveDocumentFileName = currentActiveDocument.fileName;
            currentActiveDocument.fileName = null;
            currentActiveDocument.url = null;
            currentActiveDocument.mimeType = null;

            document.active = true;
            document.verifierId = agent.id;
            document.verifiedOn = new Date();
            const documents = await this.documentRepository.save([currentActiveDocument, document]);

            // delete old active document from AWS.
            this.awsService.deleteFileFromS3(currentActiveDocumentFileName, currentActiveDocument.typeOfDocument);

            return documents.find(doc => doc.id === documentId)
        }
        catch (error) {
            logger.error(`Could not verify document. Error: ${error}`);
            throw error;
        }
    }


    async generateS3SignedURLs(profileId: string,
        fileName: string,
        typeOfDocument: TypeOfDocument): Promise<string | undefined> {

        const urlObj = await this.awsService.createSignedURL(profileId, fileName, typeOfDocument, false);

        return urlObj.preSignedUrl;
    }


    // TODO
    async seedCaste() {
        const casteNameList = 'Agrawal Khandelwal Maheshwari Brahmin Jat Rajput Kayasth Gurjar Meena'.split(' ');
        const casteList: Caste[] = [];
        for (const casteName of casteNameList) {
            const caste: Caste = this.casteRepository.create({
                name: casteName,
                religion: Religion.HINDU
            });
            casteList.push(caste);
        }

        await this.casteRepository.save(casteList);
    }


    async getCastes(): Promise<Caste[]> {
        return this.casteRepository.find();
    }


    async getCaste(casteId: number, throwOnFail = true): Promise<Caste | undefined> {
        const caste = await this.casteRepository.findOne(casteId);
        if (throwOnFail && !caste) {
            throw new NotFoundException(`Caste with id: ${casteId} not found!`);
        }
        return caste;
    }


    async getReferee(payload: string): Promise<[Referee, null | TelegramProfile | Agent]> {
        if (!payload) {
            return [Referee.NONE, null];
        } else if (payload === "w8e7d872-938c-4695-9a84-3e72e9d09a7eb") {
            return [Referee.WEBSITE, null];
        }
        else if (isUUID(payload, 4)) {
            // check user
            const telegramProfile = await this.getTelegramProfileById(payload, {
                throwOnFail: false
            });
            if (telegramProfile) {
                return [Referee.USER, telegramProfile];
            } else {
                // check agent
                const agent = await this.agentService.getAgentById(payload, {
                    throwOnFail: false
                });
                if (agent) {
                    return [Referee.AGENT, agent];
                }
            }
        }
    }


    async getRegistrationStatus(id: string): Promise<RegistrationStatus | undefined> {
        const telegramProfile = await this.telegramRepository.findOne(id, {
            relations: ['documents']
        })

        if (!telegramProfile) {
            logger.log(`getRegistrationStatus(): profile ${telegramProfile} not registered!`);
            throw new NotFoundException(`Telegram profile with id: ${telegramProfile.id} not found!`);
        }

        if (!telegramProfile.phone) {
            return RegistrationStatus.UNREGISTERED;
        }

        const documents: Document[] = telegramProfile.documents;
        if (!documents?.length) {
            return RegistrationStatus.PHONE_VERIFIED;
        }
        else {
            let bioUploaded = false, bioVerified = false, picUploaded = false, picVerified = false;
            for (let doc of documents) {
                if (doc.typeOfDocument === TypeOfDocument.BIO_DATA) {
                    bioUploaded = true;
                    if (doc.isValid) {
                        bioVerified = true;
                    }
                } else if (doc.typeOfDocument === TypeOfDocument.PICTURE) {
                    picUploaded = true;
                    if (doc.isValid) {
                        picVerified = true;
                    }
                }
            }
            if (!bioUploaded) {
                return RegistrationStatus.PHONE_VERIFIED;
            } else if (!picUploaded) {
                return RegistrationStatus.BIO_UPLOADED;
            } else {
                return RegistrationStatus.PICTURE_UPLOADED;
            }
        }
    }


    // Common data

    async seedCity() {
        // Delhi Lucknow Ghaziabad Pune Patna Mumbai Indore Bhopal Ranchi Raipur
        let cityNameList = 'Jaipur Udaipur Jaisalmer Jodhpur Kota Alwar'.split(' ');
        const cityList: City[] = [];
        for (const cityName of cityNameList) {
            const city: City = {
                name: cityName,
                state: await this.getOrCreateState('Rajasthan', 'India')
            };
            cityList.push(city);
        }
        cityNameList = 'Bangalore Mysore Belgavi Mangalore Udupi'.split(' ');
        for (const cityName of cityNameList) {
            const city: City = {
                name: cityName,
                state: await this.getOrCreateState('Karnataka', 'India')
            };
            cityList.push(city);
        }
        cityNameList = 'Pune Nashik Mumbai Jalgaon Aurangabad'.split(' ');
        for (const cityName of cityNameList) {
            const city: City = {
                name: cityName,
                state: await this.getOrCreateState('Maharashtra', 'India')
            };
            cityList.push(city);
        }
        cityNameList = 'Ghaziabad Noida Lucknow Allahabad Ayodhya'.split(' ');
        for (const cityName of cityNameList) {
            const city: City = {
                name: cityName,
                state: await this.getOrCreateState('Uttar Pradesh', 'India')
            };
            cityList.push(city);
        }
        await this.cityRepository.save(cityList);
    }


    async getOrCreateState(stateName: string, countryName: string): Promise<State | undefined> {
        if (!stateName) throw new BadRequestException("Empty or null stateName")
        let state = await this.getStateByName(stateName, countryName);
        if (!state) {
            const country = await this.getOrCreateCountry(countryName);
            state = this.stateRepository.create({
                name: stateName,
                country: country
            });
            state = await this.stateRepository.save(state);
        }
        return state;
    }


    async getOrCreateCountry(countryName: string): Promise<Country | undefined> {
        if (!countryName) throw new BadRequestException("Empty or null countryName")
        let country = await this.getCountryByName(countryName);
        if (!country) {
            country = this.countryRepository.create({
                name: countryName,
            });
            country = await this.countryRepository.save(country);
        }
        return country;
    }


    async getOrCreateCity(cityName: string, stateName: string, countryName: string): Promise<City> {
        cityName = cityName.trim();
        stateName = stateName.trim();
        countryName = countryName.trim();

        if (!cityName) throw new BadRequestException("Empty or null city name")
        let city = await this.getCityByName(cityName, stateName, countryName);
        if (!city) {
            const state = await this.getStateByName(stateName, countryName);
            if (!state) {
                throw new NotFoundException(`State: ${stateName} does not exist in db!`);
            }
            city = this.cityRepository.create({
                name: cityName,
                state,
            });
            city = await this.cityRepository.save(city);
        }

        return city;
    }


    async getStateByName(stateName: string, countryName: string): Promise<State> {
        if (!stateName) throw new BadRequestException("Empty or null stateName")
        return this.stateRepository.createQueryBuilder("state")
            .innerJoinAndSelect("state.country", "country", "country.name ILIKE :countryName",
                { countryName: countryName })
            // .where("state.name = :stateName", { stateName: stateName })
            .where("state.name ILIKE :stateName", { stateName: stateName })
            .getOne();
    }


    async getState(stateId: number, options?: GetStateOptions): Promise<State> {
        const { getCountry, throwOnFail } = options;
        if (stateId === null) throw new BadRequestException("stateId is empty")

        let state: State;

        if (!getCountry) {
            state = await this.stateRepository.findOne(stateId);
        } else {
            state = await this.stateRepository.findOne(stateId, {
                relations: ["country"]
            });
        }

        if (throwOnFail && !state) {
            throw new NotFoundException(`State with id: ${stateId} not found`);
        }

        return state;
    }


    async getStatesLike(pattern: string, countryIds: number[], skip = 0, take = 20): Promise<IList<State>> {

        const query = this.stateRepository.createQueryBuilder("state");
        let whereIsSet: boolean = false

        if (pattern) {
            query.where("state.name ILIKE :pattern", { pattern: `%${pattern}%` });
            whereIsSet = true;
        }

        if (countryIds?.length) {
            query.andWhere("state.countryId IN (:...countryIds)", { countryIds });
            // whereIsSet ? query.andWhere("state.countryId IN :countryIds", { countryIds: countryIds }) : query.where("state.countryId = :countryIds", { countryIds: countryIds });
        }

        const [states, count] = await query.skip(skip).take(take).getManyAndCount();

        return {
            count,
            values: states
        };
    }


    async getCountryByName(countryName: string, throwOnFail = true): Promise<Country | undefined> {
        if (!countryName) throw new BadRequestException("Empty or null countryName")
        // return this.countryRepository.findOne({ name: countryName });
        const country = this.countryRepository.createQueryBuilder("country")
            .where("country.name ILIKE :countryName", { countryName: countryName })
            .getOne();
        if (throwOnFail && !country) {
            throw new NotFoundException(`Country with name: ${countryName} not found`);
        }
        return country;
    }


    async getCountry(countryId: number, throwOnFail = true): Promise<Country | undefined> {
        if (countryId === null) throw new BadRequestException("countryId is null")
        const country = await this.countryRepository.findOne({ id: countryId });
        if (throwOnFail && !country) {
            throw new NotFoundException(`Country with id: ${countryId} not found`);
        }
        return country;
    }


    async getCountries(skip = 0, take = 100): Promise<Country[]> {
        return this.countryRepository.find({ skip, take });
    }


    async getCountriesLike(pattern: string, skip = 0,
        take = 20): Promise<Country[]> {

        const query = this.countryRepository.createQueryBuilder("country");
        // let whereIsSet: boolean = false

        if (pattern) {
            query.where("country.name ILIKE :pattern", { pattern: `%${pattern}%` });
            // whereIsSet = true;
        }

        return query.skip(skip).take(take).getMany();
    }


    async getCityByName(cityName: string, stateName: string, countryName: string): Promise<City> {
        if (!cityName) throw new BadRequestException("Empty or null cityName")
        return this.cityRepository.createQueryBuilder("city")
            .innerJoinAndSelect("city.state", "state", "state.name ILIKE :stateName",
                { stateName: stateName })
            .innerJoinAndSelect("state.country", "country", "country.name ILIKE :countryName",
                { countryName: countryName })
            // .where("city.name = :cityName", { cityName: cityName })
            .where("city.name ILIKE :cityName", { cityName: cityName })
            .getOne();
    }


    async getCitiesOfState(stateId: number, skip = 0, take = 100, getState = false, getCountry = false): Promise<City[]> {
        const relations = [];
        if (getState)
            relations.push('state');
        if (getCountry)
            relations.push('state.country');

        if (stateId !== null) {
            return this.cityRepository.find({
                where: { stateId: stateId },
                relations,
                skip,
                take
            });
        } else {
            return this.getCities(skip, take, getState, getCountry);
        }
    }


    private async getCountryIdsForStates(stateIds: number[]): Promise<Country[] | undefined> {
        const query = `SELECT DISTINCT c.id 
            FROM country c INNER JOIN state s ON s."countryId" = c.id
            WHERE s.id IN (${stateIds.join(',')});`;
        console.log('getCountryIdsForStates() query:', query);
        const results = await this.stateRepository.query(query);
        return results.map(result => result.id);
    }


    // defining named parameters
    // ref: https://medium.com/better-programming/named-parameters-in-typescript-e32c763d2b2e#:~:text=Even%20though%20there%20is%20technically,play%20with%20letters%20in%20Scrabble.
    async getCitiesLike(pattern: string,
        {
            countryIds = [],
            stateIds = [],
            skip = 0,
            take = 20,
        }): Promise<IList<City>> {

        let query = this.cityRepository.createQueryBuilder("city");
        let whereIsSet: boolean = false

        if (pattern) {
            query = query.where("city.name ILIKE :pattern", { pattern: `${pattern}%` });
            whereIsSet = true;
        }

        // console.log('stateIds, countryIds:', stateIds, countryIds);

        if (stateIds?.length) {
            stateIds = deDuplicateArray(stateIds);
            query.andWhere("city.stateId IN (:...stateIds)", { stateIds })

            const countryIdsForStates = await this.getCountryIdsForStates(stateIds);
            // console.log('countryIdsForStates:', countryIdsForStates);
            countryIds = setDifferenceFromArrays(countryIds, countryIdsForStates);
            // console.log('remaining countryIds:', countryIds);
        }
        // TODO: test - search restricted to a country probably doesn't yet work.
        if (countryIds?.length) {
            query.leftJoin("city.state", "state")
                .orWhere("state.countryId IN (:...countryIds)", { countryIds })
        }

        const [cities, count] = await query.skip(skip).take(take).getManyAndCount();

        return {
            count,
            values: cities
        };
    }


    async getCity(cityId: number, options?: GetCityOptions): Promise<City> {
        const { getState, getCountry, throwOnFail } = options;
        if (cityId === null) throw new BadRequestException("cityId is empty")

        let city: City;

        if (!getState && !getCountry) {
            city = await this.cityRepository.findOne(cityId);
        }

        const relations = [];
        if (getState)
            relations.push('state');
        if (getCountry)
            relations.push('state.country');

        city = await this.cityRepository.findOne(cityId, {
            relations
        });

        if (throwOnFail && !city) {
            throw new NotFoundException(`City with id: ${cityId} not found`);
        }

        return city;
    }


    async getCities(skip = 0, take = 100, getState = false, getCountry = false): Promise<City[]> {
        const relations = [];
        if (getState)
            relations.push('state');
        if (getCountry)
            relations.push('state.country');

        return this.cityRepository.find({
            skip,
            take,
            relations
        });
    }


    async getRandomCities(take = 1): Promise<any[]> {
        // const relations = ['state', 'country'];

        const results = await this.cityRepository.query(
            'SELECT id FROM city TABLESAMPLE SYSTEM_ROWS($1);', [take]);

        return results.map(result => result.id);
    }


    getCommonData(): CommonData {
        return {
            maleAgeList: maleAgeList,
            femaleAgeList: femaleAgeList,
        }
    }
}