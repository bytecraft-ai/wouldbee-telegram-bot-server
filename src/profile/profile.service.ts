import { Injectable, UnauthorizedException, Logger, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException, NotImplementedException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { femaleAgeList, Gender, maleAgeList, Referee, Religion, TypeOfDocument, TypeOfIdProof, RegistrationStatus, MaritalStatus, ProfileSharedWith, S3Option } from 'src/common/enum';
import { deDuplicateArray, getAgeInYearsFromDOB, setDifferenceFromArrays } from 'src/common/util';
import { IsNull, Not, Repository } from 'typeorm';
// import { TelegramAuthenticateDto } from './dto/telegram-auth.dto';
import { PartnerPreferenceDto, CreateUserDto, CreateProfileDto, RegistrationDto, CreateCasteDto } from './dto/profile.dto';
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
// import { SharedMatch } from './entities/shared-profiles.entity';
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
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Match } from './entities/match.entity';
import _ from 'lodash';
import { TelegramService } from 'src/telegram/telegram.service';
import { DocumentValidationDto } from './dto/location.dto';

const logger = new Logger('ProfileService');

@Injectable()
export class ProfileService {
    constructor(
        private readonly awsService: AwsService,
        private readonly agentService: AgentService,

        @Inject(forwardRef(() => TelegramService))
        private readonly telegramService: TelegramService,

        @InjectQueue('find-match') private matchFinderQueue: Queue,

        // @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Profile) private profileRepository: Repository<Profile>,
        @InjectRepository(TelegramProfile) private telegramRepository: Repository<TelegramProfile>,
        // @InjectRepository(SharedMatch) private sharedProfileRepository: Repository<SharedMatch>,
        @InjectRepository(Match) private matchRepository: Repository<Match>,
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
        const { telegramProfileId, name, gender, dob, religion, casteId, annualIncome, cityId, highestDegree, employedIn, occupation, motherTongue, maritalStatus } = profileDto;

        let profile = await this.profileRepository.findOne(telegramProfileId);
        if (profile) {
            throw new
                ConflictException('profile already exists!');
        }

        const approvedBio = await this.documentRepository.findOne({
            where: { telegramProfileId, isActive: true }
        })
        if (!approvedBio) {
            throw new ConflictException('No approved bio-data exists for this profile.');
        }

        const caste = await this.getCaste(casteId, true);
        const city = await this.getCity(cityId, { throwOnFail: true });
        profile = this.profileRepository.create({
            id: telegramProfileId,
            name,
            gender,
            dob,
            religion,
            caste,
            annualIncome,
            city,
            highestDegree,
            employedIn,
            occupation,
            motherTongue,
            maritalStatus,
        })
        const savedProfile = await this.profileRepository.save(profile);

        // add match-finding job to queue for create profile
        await this.matchFinderQueue.add('create',
            { profileId: savedProfile.id },
            { delay: 3000 }, // 3 seconds delayed
        );

        return savedProfile;
    }


    async getProfiles(): Promise<Profile[] | undefined> {
        return this.profileRepository.find();
    }


    async getProfile(id: string, { throwOnFail = true }): Promise<Profile | undefined> {
        const profile = await this.profileRepository.findOne(id);
        if (throwOnFail && !profile) {
            throw new NotFoundException(`Profile with id: ${id} not found`);
        }
        return profile;
    }


    async getPreference(id: string, { throwOnFail = true }): Promise<PartnerPreference | undefined> {
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
        const profile = await this.getProfile(id, { throwOnFail: true });

        let pref = await this.getPreference(id, { throwOnFail: false });
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
        if (cityIds) {
            for (let cityId of cityIds) {
                const city = await this.getCity(cityId, { throwOnFail: true });
                cities.push(city);
            }
        }

        const states: State[] = [];
        if (stateIds) {
            for (let stateId of stateIds) {
                const state = await this.getState(stateId, { throwOnFail: true });
                states.push(state);
            }
        }

        const countries: Country[] = [];
        if (countryIds) {
            for (let countryId of countryIds) {
                const country = await this.getCountry(countryId, true);
                countries.push(country);
            }
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

        // add match-finding job to queue for update profile
        await this.matchFinderQueue.add('update',
            { profileId: profile.id },
            { delay: 3000 }, // 3 seconds delayed
        );

        return pref;
    }


    async getMatches(profileId: string, skip = 0, take = 20): Promise<IList<Profile>> {
        const profile = await this.profileRepository.findOne(profileId, {
            relations: ["partnerPreference", "caste", "city"]
        });
        if (!profile) {
            throw new NotFoundException(`Profile with id: ${profileId} not found`);
        }

        const partnerPref = profile.partnerPreference;
        const caste = profile.caste;
        const city = profile.city;
        const oppGender = profile.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE

        const matchQuery = this.profileRepository.createQueryBuilder("t_profile")
            .leftJoin("t_profile.partnerPreference", "t_partner_pref")
            .leftJoin("t_partner_pref.castes", "t_pref_castes")
            .leftJoin("t_profile.city", "t_city");

        matchQuery.where('t_profile.gender = :oppGender', { oppGender });

        let preferredMaritalStatuses = []
        if (partnerPref?.maritalStatuses?.length) {
            preferredMaritalStatuses = partnerPref.maritalStatuses;
            matchQuery.andWhere("t_profile.maritalStatus IN (:...ms)", { ms: preferredMaritalStatuses });
        }
        else {
            if (profile?.maritalStatus) {
                matchQuery.addSelect(`CASE 
                WHEN t_profile."maritalStatus" = ${MaritalStatus.NEVER_MARRIED} THEN 1 
                WHEN t_profile."maritalStatus" = ${MaritalStatus.ANULLED} THEN 2 
                ELSE 9
                END`, "_marital_status_rank");

                // sort on added field
                matchQuery.orderBy("_marital_status_rank",
                    (profile.maritalStatus === MaritalStatus.NEVER_MARRIED)
                        ? 'ASC' : 'DESC');
            }
        }

        // reverse check - match's partner pref should have this profile's marital status
        matchQuery.andWhere("(t_partner_pref.maritalStatuses IS NULL OR t_partner_pref.maritalStatuses && :maritalStatuses)", { maritalStatuses: [profile.maritalStatus] });

        // religion check
        if (partnerPref.religions && partnerPref.religions.length > 0) {
            matchQuery.andWhere("t_profile.religion IN (:...religions)", { religions: partnerPref.religions });
        }

        // reverse religion check
        matchQuery.andWhere("(t_partner_pref.religions IS NULL OR t_partner_pref.religions && :religion)", { religion: [profile.religion] });


        // gotra
        // if (partnerPref.leaveSelfGotra && profile.gotraId !== null) {
        //     matchQuery.andWhere("t_social.gotraId != :selfGotra", { selfGotra: profile.socialDetails.gotraId });
        // }

        // caste & sub-caste policy -
        // 1. if user has not set any preference, show all castes but show profiles from his caste first.
        // 2. if user has set a preference then use that.
        if (partnerPref?.castes?.length) {
            const casteIdList = partnerPref.castes.map(c => c.id)
            matchQuery.andWhere("t_profile.casteId IN (:...c)", { c: casteIdList });
        }

        // reverse caste check
        if (profile.casteId) {
            matchQuery.andWhere("(t_pref_castes.id IS NULL OR t_pref_castes.id = :casteId)", { casteId: profile.casteId });
        }

        const [matches, count] = await
            matchQuery.skip(skip).take(take).getManyAndCount();

        return {
            count,
            values: matches
        };
    }


    async saveMatches(profileId: string, matches: Profile[]): Promise<Match[]> {
        const profile = await this.getProfile(profileId, { throwOnFail: true });
        const toSave: Match[] = [];
        if (profile.gender === Gender.MALE) {
            for (const match of matches) {
                toSave.push(this.matchRepository.create({
                    maleProfile: profile,
                    femaleProfile: match
                }));
            }
        } else {
            for (const match of matches) {
                toSave.push(this.matchRepository.create({
                    maleProfile: match,
                    femaleProfile: profile
                }));
            }
        }
        return this.matchRepository.save(toSave);
    }


    @Transactional()
    async updateMatches(profileId: string, matches: Profile[]): Promise<Match[]> {
        const profile = await this.getProfile(profileId, { throwOnFail: true });

        // remove existing matches which have not been shared.
        await this.matchRepository.delete(profile.gender === Gender.MALE ?
            {
                maleProfileId: profileId,
                profileSharedWith: ProfileSharedWith.NONE
            } :
            {
                femaleProfileId: profileId,
                profileSharedWith: ProfileSharedWith.NONE
            })

        const sentMatches = await this.matchRepository.find({
            where: profile.gender === Gender.MALE ?
                { maleProfileId: profileId } :
                { femaleProfileId: profileId },
        });

        if (sentMatches?.length) {
            const matchProfileId = profile.gender === Gender.FEMALE
                ? 'maleProfileId' : 'femaleProfileId';

            const sentMatchesIds = sentMatches.map(
                sentMatch => sentMatch[matchProfileId]);

            matches = matches.filter(match =>
                !(sentMatchesIds.find(matchProfileId =>
                    matchProfileId === match.id
                )))
        }
        return this.saveMatches(profileId, matches)
    }


    async getTelegramProfileForSending(profile: Profile): Promise<TelegramProfile | undefined> {
        const telegramProfile = await
            this.telegramRepository.findOne(profile.id, {
                relations: ['bioData', 'picture', 'idProof']
            });
        if (!telegramProfile) {
            logger.error(`Could not get telegram profile for profile with id: ${profile.id}`);
            throw new NotFoundException(`Could not get telegram profile for profile with id: ${profile.id}`)
        }
        return telegramProfile;
    }


    async sendMatch(match: Match) {
        if (!match?.maleProfile || !match.femaleProfile) {
            throw new Error('match object does not contain male or/and female profiles');
        }

        const maleProfile = match.maleProfile;
        const femaleProfile = match.femaleProfile;

        const maleTeleProfile = await this.getTelegramProfileForSending
            (maleProfile);

        const femaleTeleProfile = await this.getTelegramProfileForSending(femaleProfile);

        await this.telegramService.sendProfile(maleTeleProfile, femaleProfile, femaleTeleProfile);

        await this.telegramService.sendProfile(femaleTeleProfile, maleProfile, maleTeleProfile);
    }


    async sendMatches() {
        let skip = 0
        const take = 50;
        let [profiles, count] = await this.profileRepository.findAndCount({
            where: { gender: Gender.FEMALE },
            skip, take
        });
        if (count > 0) {
            do {
                // const matches = await this.matchRepository.find({
                //     where: { femaleProfile: profiles }
                // });

                const matches = await this.matchRepository.createQueryBuilder('match')
                    .select('DISTINCT ON (femaleProfileId) id, maleProfileId, femaleProfileId, profileSharedWith')
                    .where('match.profileSharedWith = :none',
                        { none: ProfileSharedWith.NONE })
                    .andWhere('match.femaleProfileId IN (:...femaleProfileIds)',
                        { femaleProfileIds: profiles.map(profile => profile.id) })
                    .getMany();

                skip += take;
                [profiles, count] = await this.profileRepository.findAndCount({
                    where: { gender: Gender.FEMALE },
                    skip, take
                });

            } while (skip < count)
        }
        // const [matches, count] = this.matchRepository.createQueryBuilder('match')
        //     .where()

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


    async getTelegramProfilesForVerification(skip = 0, take = 20): Promise<IList<TelegramProfile> | undefined> {

        if (take < 1 || take > 100) {
            throw new Error('1 ≤ take ≥ 100');
        }


        const query = this.telegramRepository.createQueryBuilder('tel_profile');
        query.leftJoin('tel_profile.documents', 'document')
            .where('document.isValid IS NULL')
            .andWhere('document.isActive IS NULL')

        const [telegramProfiles, count] = await query.skip(skip).take(take).getManyAndCount();

        return {
            count,
            values: telegramProfiles
        };
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
            logger.log(`Telegram profile with id: ${id} not found!`);
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
            where: { telegramProfileId, typeOfDocument },
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
                where: { telegramProfileId: telegramProfile.id, typeOfDocument: typeOfDocument, isValid: IsNull(), fileName: Not(IsNull()) },
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
                console.log('unverifiedDocument:', unverifiedDocument);
                const oldFileName = unverifiedDocument.fileName.slice();
                // mark old unverified document as inactive;
                unverifiedDocument.isActive = false;
                unverifiedDocument.url = null;
                unverifiedDocument.fileName = null;
                unverifiedDocument.mimeType = null;

                // Save repo & delete file from aws
                await this.documentRepository.save(unverifiedDocument);
                await this.awsService.deleteFileFromS3(oldFileName, typeOfDocument);
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
    async validateDocument(telegramProfileId: string, validationInput: DocumentValidationDto, agent: Agent): Promise<Document | undefined> {
        const { documentId, valid, rejectionReason, rejectionDescription } = validationInput;
        try {
            let document = await this.documentRepository.findOne(documentId);

            if (!document || document.telegramProfileId !== telegramProfileId) {
                throw new NotFoundException(`Document with id: ${documentId} does not exist!`);
            }

            document.isActive = valid;
            document.isValid = valid;
            document.invalidationReason = rejectionReason;
            document.invalidationDescription = rejectionDescription;
            document.verifierId = agent.id;
            document.verifiedOn = new Date();
            document = await this.documentRepository.save(document);

            if (valid) {
                // find current active document, mark as inactive and delete from AWS in the end
                let currentActiveDocument = await this.documentRepository.findOne({
                    where: {
                        telegramProfileId: document.telegramProfileId,
                        typeOfDocument: document.typeOfDocument,
                        isActive: true
                    }
                });
                let currentActiveDocumentFileName: string;
                if (currentActiveDocument) {
                    currentActiveDocument.isActive = false;
                    currentActiveDocumentFileName = currentActiveDocument.fileName.slice();
                    currentActiveDocument.fileName = null;
                    currentActiveDocument.url = null;
                    currentActiveDocument.mimeType = null;

                    await this.documentRepository.save(currentActiveDocument);

                    // delete old active document from AWS.
                    await this.awsService.deleteFileFromS3(currentActiveDocumentFileName, currentActiveDocument.typeOfDocument);
                }
            }

            return document;
        }
        catch (error) {
            logger.error(`Could not verify document. Error: ${error}`);
            throw error;
        }
    }


    // async generateS3SignedURLs(telegramProfileId: string,
    //     fileName: string,
    //     typeOfDocument: TypeOfDocument): Promise<string | undefined> {

    //     const urlObj = await this.awsService.createSignedURL(telegramProfileId, fileName, typeOfDocument, false);

    //     return urlObj.preSignedUrl;
    // }


    async getSignedDownloadUrl(telegramProfileId: string, docType: string, { throwOnFail = true }): Promise<{ id: number, url: string } | undefined> {
        if (!docType) {
            throw new BadRequestException('docType is required!')
        }

        let typeOfDocument: TypeOfDocument;
        switch (docType) {
            case 'bio-data':
                typeOfDocument = TypeOfDocument.BIO_DATA;
                break;
            case 'picture':
                typeOfDocument = TypeOfDocument.PICTURE;
                break;
            case 'id-proof':
                typeOfDocument = TypeOfDocument.ID_PROOF;
                break;
            default:
                throw new BadRequestException(`docType should be one of [bio-data, picture, id-proof]`);
        }

        const telegramProfile = await this.getTelegramProfileById(telegramProfileId, { throwOnFail: true });

        const document = await this.documentRepository.createQueryBuilder('doc')
            .where('doc.telegramProfileId = :telegramProfileId', { telegramProfileId })
            .andWhere('doc.typeOfDocument = :typeOfDocument', { typeOfDocument })
            .andWhere('doc.isActive IS NULL')
            .orderBy('doc.createdOn', 'DESC')
            .getOne();

        if (!document) {
            if (throwOnFail) {
                throw new NotFoundException(`Document for telegram profile with id: ${telegramProfileId} and docType: ${typeOfDocument} does not exist!`);
            } else {
                return null;
            }
        }

        try {
            const urlObj = await this.awsService.createSignedURL(telegramProfileId, document.fileName, document.typeOfDocument, S3Option.GET);
            return {
                id: document.id,
                url: urlObj.preSignedUrl
            };
        }
        catch (err) {
            logger.error(`Could not generate signed url for telegramProfileId: ${telegramProfileId}, and docType: ${docType}. Error: ${err}`);
            throw err;
        };
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


    async getCastesLike(like: string, skip = 0, take = 20): Promise<Caste[]> {
        if (take > 100) {
            throw new Error('Maximum value allowed for take is 100');
        }

        let query = this.casteRepository.createQueryBuilder("caste");
        if (like) {
            query = query.where("caste.name ILIKE :like", { like: `${like}%` });
        }
        return query.skip(skip).take(take).getMany();
    }


    async createCastes(casteNames: string[], religion: Religion): Promise<Caste[]> {
        const castes: Caste[] = [];
        for (let name of casteNames) {
            castes.push(this.casteRepository.create({
                name,
                religion
            }));
        }
        return this.casteRepository.save(castes);
    }


    async createCaste(createCasteDto: CreateCasteDto): Promise<Caste> {
        let caste = await this.casteRepository.findOne({
            where: {
                name: createCasteDto.casteName,
                religion: createCasteDto.religion
            }
        });

        if (caste) {
            throw new ConflictException(`Caste with name: ${createCasteDto.casteName} already exists`);
        }

        caste = this.casteRepository.create({
            name: createCasteDto.casteName,
            religion: createCasteDto.religion
        });

        return this.casteRepository.save(caste);
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


    async getVerificationStatus(telegramProfileId: string) {
        const telegramProfile = await this.telegramRepository.findOne(telegramProfileId, {
            relations: ['documents']
        })

        if (!telegramProfile) {
            logger.log(`getRegistrationStatus(): profile ${telegramProfile} not registered!`);
            throw new NotFoundException(`Telegram profile with id: ${telegramProfile.id} not found!`);
        }

        if (!telegramProfile.phone) {
            return RegistrationStatus.UNREGISTERED;
        }
    }


    async getRegistrationStatus(telegramProfileId: string): Promise<RegistrationStatus | undefined> {
        const telegramProfile = await this.telegramRepository.findOne(telegramProfileId, {
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

        if (take > 100) {
            throw new Error('Maximum value allowed for take is 100');
        }

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

        if (take > 100) {
            throw new Error('Maximum value allowed for take is 100');
        }

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


    async createCountry(country: Object): Promise<Country | undefined> {
        const countryEntity = this.countryRepository.create({
            id: country['id'],
            iso2: country['iso2'],
            iso3: country['iso3'],
            name: country['name'],
            phoneCode: country['phone_code'],
        })
        return this.countryRepository.save(countryEntity);
    }


    async createStates(states: Object[], countryId: number): Promise<State[] | undefined> {
        const stateEntities: State[] = [];
        for (let state of states) {
            const stateEntity = this.stateRepository.create({
                id: state['id'],
                name: state['name'],
                stateCode: state['state_code'],
                countryId
            });
            stateEntities.push(stateEntity);
        }
        return this.stateRepository.save(stateEntities);
    }


    async createCities(cities: Object[], stateId: number): Promise<City[] | undefined> {
        const cityEntities: City[] = [];
        for (let city of cities) {
            // console.log(city['id'], city['name'], city['latitude'], city['longitude'], stateId);
            const cityEntity = this.cityRepository.create({
                id: city['id'],
                name: city['name'],
                latitude: city['latitude'],
                longitude: city['longitude'],
                stateId
            });
            cityEntities.push(cityEntity)
        }

        return this.cityRepository.save(cityEntities);
    }


    getCommonData(): CommonData {
        return {
            maleAgeList: maleAgeList,
            femaleAgeList: femaleAgeList,
        }
    }
}