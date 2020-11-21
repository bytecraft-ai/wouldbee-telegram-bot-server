import { Injectable, Logger, BadRequestException, NotFoundException, ConflictException, NotImplementedException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { femaleAgeList, Gender, maleAgeList, Referee, Religion, TypeOfDocument, TypeOfIdProof, MaritalStatus, ProfileSharedWith, S3Option, RegistrationActionRequired, UserStatOptions, ProfileDeactivationDuration, ProfileDeletionReason, UserStatus } from 'src/common/enum';
import { daysAhead, deDuplicateArray, getAgeInYearsFromDOB, nextWeek, setDifferenceFromArrays } from 'src/common/util';
import { IsNull, LessThanOrEqual, Not, Repository, SelectQueryBuilder } from 'typeorm';
import { PartnerPreferenceDto, CreateProfileDto, CreateCasteDto, SupportResolutionDto } from './dto/profile.dto';
import { Caste } from './entities/caste.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { PartnerPreference } from './entities/partner-preference.entity';
import { Profile } from './entities/profile.entity';
import { State } from './entities/state.entity';
import { GetCityOptions, GetStateOptions } from './profile.interface';
import { TelegramProfile } from './entities/telegram-profile.entity';
import { AwsService } from 'src/aws-service/aws-service.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { CommonData, IList, IUserStats } from 'src/common/interface';
import { Document } from './entities/document.entity';
import { isUUID } from 'class-validator';
import { AgentService } from 'src/agent/agent.service';
import { WbAgent } from 'src/agent/entities/agent.entity';
import { isNil } from 'lodash';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Match } from './entities/match.entity';
import { TelegramService } from 'src/telegram/telegram.service';
import { BanProfileDto, DocumentValidationDto } from './dto/location.dto';
// import { DeactivatedProfile } from './entities/deactivated-profile.entity';
import { Cron } from '@nestjs/schedule';
import { assert } from 'console';
import { Support } from './entities/support.entity';
import { DeactivatedProfile } from './entities/deactivated-profile.entity';
import { ProfileMarkedForDeletion } from './entities/to-delete-profile.entity';

const logger = new Logger('ProfileService');

// TODO: use data-loaders for speeding up stuff.
@Injectable()
export class ProfileService {
    constructor(
        private readonly awsService: AwsService,
        private readonly agentService: AgentService,

        @Inject(forwardRef(() => TelegramService))
        private readonly telegramService: TelegramService,

        @InjectQueue('scheduler-queue') private schedulerQueue: Queue,

        @InjectRepository(Profile) private profileRepository: Repository<Profile>,
        @InjectRepository(TelegramProfile) private telegramRepository: Repository<TelegramProfile>,
        @InjectRepository(DeactivatedProfile) private deactivatedProfileRepository:
            Repository<DeactivatedProfile>,
        @InjectRepository(ProfileMarkedForDeletion) private toDeleteProfileRepository: Repository<ProfileMarkedForDeletion>,

        @InjectRepository(Match) private matchRepository: Repository<Match>,
        @InjectRepository(PartnerPreference) private prefRepository: Repository<PartnerPreference>,

        @InjectRepository(Document) private documentRepository: Repository<Document>,
        @InjectRepository(Support) private supportRepository: Repository<Support>,

        @InjectRepository(Caste) private casteRepository: Repository<Caste>,
        @InjectRepository(City) private cityRepository: Repository<City>,
        @InjectRepository(State) private stateRepository: Repository<State>,
        @InjectRepository(Country) private countryRepository: Repository<Country>,
    ) { }


    // TODO: test
    async userStats(userType: UserStatOptions): Promise<IUserStats> {
        let query: SelectQueryBuilder<TelegramProfile>;
        let profileQuery: SelectQueryBuilder<Profile>;
        let output: IUserStats;

        switch (userType) {
            case UserStatOptions.REGISTRATION_FAILURE:
                return {
                    total: await this.telegramRepository.count({
                        where: { phone: IsNull() }
                    })
                };

            case UserStatOptions.NEW:
                query = this.telegramRepository.createQueryBuilder('tprofile')
                    .leftJoin('tprofile.document', 'document')
                    .leftJoin('tprofile.profile', 'profile')
                    .where('document.typeOfDocument = :tod', { tod: TypeOfDocument.BIO_DATA })
                    .andWhere('document.fileName IS NOT NULL')
                    .andWhere('profile.id IS NULL');
                return {
                    total: await query.getCount()
                };

            case UserStatOptions.VALID:
                query = this.telegramRepository.createQueryBuilder('tprofile')
                    // .leftJoin('tprofile.document', 'document')
                    .leftJoin('tprofile.profile', 'profile')
                    .select('profile.gender')
                    .addSelect('COUNT(user.id)', 'count')
                    // .where('document.typeOfDocument = :tod', { tod: TypeOfDocument.BIO_DATA })
                    // .andWhere('document.fileName IS NOT NULL')
                    .andWhere('profile.id IS NOT NULL')
                    .groupBy('profile.gender');
                const counts = await query.getRawMany();
                console.log('valid users query result:', counts);

                for (const iterator of counts) {
                    if (iterator['gender'] === Gender.MALE) {
                        output.male = iterator['count'];
                    }
                    else if (iterator['gender'] === Gender.FEMALE) {
                        output.female = iterator['count'];
                    }
                }

                output.total = output.male + output.female;
                return output;

            case UserStatOptions.INVALID:
                query = this.telegramRepository.createQueryBuilder('tprofile')
                    .leftJoin('tprofile.document', 'document')
                    .leftJoinAndSelect('tprofile.profile', 'profile')
                    .where('document.typeOfDocument = :tod', { tod: TypeOfDocument.BIO_DATA })
                    // bio should be invalidated
                    .andWhere('document.isValid = false')
                    // no other bio should be validated
                    .andWhere('document.isValid != true');
                return {
                    total: await query.getCount()
                };

            case UserStatOptions.BANNED:
                return {
                    total: await this.telegramRepository.count({
                        where: { isBanned: true }
                    })
                };

            case UserStatOptions.TOTAL:
            case UserStatOptions.ACTIVE:
            case UserStatOptions.DEACTIVATED:
                profileQuery =
                    this.profileRepository.createQueryBuilder('profile');

                if (userType === UserStatOptions.DEACTIVATED)
                    profileQuery.where('profile.active = false')
                else if (userType === UserStatOptions.ACTIVE)
                    profileQuery.where('profile.active = true')

                profileQuery.select('profile.gender')
                    .addSelect('COUNT(profile.id)', 'count')
                    .groupBy('profile.gender')
                    .getRawMany();

                for (const iterator of counts) {
                    if (iterator['gender'] === Gender.MALE) {
                        output.male = iterator['count'];
                    }
                    else if (iterator['gender'] === Gender.FEMALE) {
                        output.female = iterator['count'];
                    }
                }
                output.total = output.male + output.female;
                return output;

            case UserStatOptions.DELETED:
            default:
                throw new NotImplementedException('Not implemented!');
        }
    }


    @Transactional()
    async saveProfile(profileDto: CreateProfileDto): Promise<Profile | undefined> {
        const { telegramProfileId, name, gender, dob, religion, casteId, annualIncome, cityId, highestDegree, employedIn, occupation, motherTongue, maritalStatus } = profileDto;

        const telegramProfile = await this.getTelegramProfileById(telegramProfileId, {
            throwOnFail: true,
            relations: ['profile', 'bioData']
        });

        const approvedBio = telegramProfile.bioData;
        if (!approvedBio) {
            throw new ConflictException('No approved bio-data exists for this profile.');
        }

        let profile = telegramProfile.profile;
        if (!profile) {
            profile = this.profileRepository.create();
        }

        const caste = await this.getCaste(casteId, true);
        const city = await this.getCity(cityId, { throwOnFail: true });

        profile.id = telegramProfileId;
        profile.name = name;
        profile.gender = gender;
        profile.dob = dob;
        profile.religion = religion;
        profile.caste = caste;
        profile.annualIncome = annualIncome;
        profile.city = city;
        profile.highestDegree = highestDegree;
        profile.employedIn = employedIn;
        profile.occupation = occupation;
        profile.motherTongue = motherTongue;
        profile.maritalStatus = maritalStatus;

        try {
            profile = await this.profileRepository.save(profile);
            if (telegramProfile.status === UserStatus.ACTIVATION_PENDING) {
                await this.telegramRepository.update({ id: telegramProfileId }, { status: UserStatus.ACTIVATED });
            }
        } catch (error) {
            logger.error(`Could not save profile. Error:\n${JSON.stringify(error)}`);
            throw error;
        }

        // add match-finding job to queue for create profile
        await this.schedulerQueue.add('create-profile',
            { profileId: profile.id },
            { delay: 3000 }, // 3 seconds delayed
        );

        return profile;
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
        await this.schedulerQueue.add('update-profile',
            { profileId: profile.id },
            { delay: 3000 }, // 3 seconds delayed
        );

        return pref;
    }


    // TODO: test
    @Transactional()
    async softDeleteProfile(telegramUserId: number, reason: ProfileDeletionReason) {
        logger.log(`softDeleteProfile(telegramUserId: ${telegramUserId}): start`);
        const telegramProfile = await this.telegramRepository.findOne({
            where: { telegramUserId },
            relations: ['profile']
        });
        if (!telegramProfile) {
            throw new NotFoundException(`Telegram profile with telegram user id: ${telegramUserId} not found!`);
        }

        const profile: Profile = telegramProfile.profile;
        const gender = profile.gender;
        if (!profile) {
            throw new NotFoundException('Profile for this telegram user does not exist!');
        }

        try {
            await this.profileRepository.softDelete(telegramProfile.id);
            await this.prefRepository.softDelete(telegramProfile.id);

            // delete documents
            await this.documentRepository.createQueryBuilder('document')
                .where('document.telegramProfileId = :telegramProfileId',
                    { telegramProfileId: telegramProfile.id })
                .softDelete().execute();

            const matchDeleteQuery =
                this.matchRepository.createQueryBuilder('match');

            if (gender === Gender.MALE) {
                matchDeleteQuery.where('match.maleProfileId = :id', { id: profile.id });
            } else {
                matchDeleteQuery.where('match.femaleProfileId = :id', { id: profile.id });
            }

            await matchDeleteQuery.softDelete().execute();

            await this.deactivatedProfileRepository.createQueryBuilder()
                .whereInIds(profile.id).softDelete().execute();

            await this.toDeleteProfileRepository.createQueryBuilder()
                .whereInIds(profile.id).softDelete().execute();

            telegramProfile.status = UserStatus.DELETED;
            telegramProfile.reasonForDeletion = reason;
            await this.telegramRepository.save(telegramProfile);

        } catch (error) {
            logger.error(`Could not delete profile. Error:\n${JSON.stringify(error)}`);
            throw error;
        }
    }


    @Transactional()
    async markProfileForDeletion(telegramUserId: number, reason: ProfileDeletionReason) {
        logger.log(`markProfileForDeletion(telegramUserId: ${telegramUserId}): start`);
        const telegramProfile: TelegramProfile = await this.telegramRepository.findOne({
            where: { telegramUserId },
            relations: ['profile']
        });
        if (!telegramProfile) {
            throw new NotFoundException(`Telegram profile with telegram user id: ${telegramUserId} not found!`);
        }
        let profile = telegramProfile.profile;

        if (telegramProfile.status >= UserStatus.ACTIVATION_PENDING
            && telegramProfile.status < UserStatus.PENDING_DELETION) {
            throw new ConflictException("Cannot delete banned or unregistered profiles.")
        }

        // if the profile exists and is not banned, mark it for deletion

        let toDeleteProfile: ProfileMarkedForDeletion = await this.toDeleteProfileRepository.findOne(telegramProfile.id);

        assert(!toDeleteProfile, `toDeleteProfile should not exist for this profile. Id: ${telegramProfile.id}`);

        toDeleteProfile = this.toDeleteProfileRepository.create({
            telegramProfile,
            lastActiveStatus: profile?.active,
            lastProfileStatus: telegramProfile.status,
            deleteOn: nextWeek()
        });

        try {
            await this.toDeleteProfileRepository.save(toDeleteProfile);

            if (profile) {
                profile.active = false;
                profile = await this.profileRepository.save(profile);
            }

            telegramProfile.status = UserStatus.PENDING_DELETION;
            telegramProfile.reasonForDeletion = reason;
            await this.telegramRepository.save(telegramProfile);
        }
        catch (error) {
            logger.error(`Could not mark profile for deletion. Telegram Profile Id: ${telegramProfile.id}, Error:\n${JSON.stringify(error)}`);
            throw error;
        }
    }


    @Transactional()
    async cancelProfileForDeletion(telegramUserId: number) {
        logger.log(`cancelProfileForDeletion(telegramUserId: ${telegramUserId}): start`);
        const telegramProfile: TelegramProfile = await
            this.getTelegramProfileByTelegramUserId(telegramUserId, {
                throwOnFail: true,
                relations: ['profile']
            });

        let profile = telegramProfile.profile;

        if (telegramProfile.status !== UserStatus.PENDING_DELETION) {
            throw new ConflictException("Cannot cancel deletion for a profile that is not marked for deletion.");
        }

        // if the profile exists and is marked for deletion, un-mark it.

        let toDeleteProfile: ProfileMarkedForDeletion = await this.toDeleteProfileRepository.findOne(telegramProfile.id);

        assert(toDeleteProfile, `toDeleteProfile should exist for this profile. Id: ${telegramProfile.id}`);

        try {
            if (profile) {
                profile.active = toDeleteProfile?.lastActiveStatus;
                profile = await this.profileRepository.save(profile);
            }

            telegramProfile.status = toDeleteProfile?.lastProfileStatus;
            telegramProfile.reasonForDeletion = null;
            await this.telegramRepository.save(telegramProfile);

            await this.toDeleteProfileRepository.delete(telegramProfile.id);
        }
        catch (error) {
            logger.error(`Could not cancel profile marked for deletion. Telegram Profile Id: ${telegramProfile.id}, Error:\n${JSON.stringify(error)}`);
            throw error;
        }
    }


    // TODO: test
    @Transactional()
    async deactivateProfile(telegramUserId: number, deactivateFor: ProfileDeactivationDuration): Promise<Profile | undefined> {
        logger.log(`deactivateProfile(telegramUserId: ${telegramUserId}): start`);

        const telegramProfile = await this.getTelegramProfileByTelegramUserId(telegramUserId, { throwOnFail: true, relations: ['profile'] });

        let profile = telegramProfile.profile;

        if (telegramProfile.status !== UserStatus.ACTIVATED) {
            logger.error(`Conflict - Profile with id: ${telegramProfile.id} is not in ACTIVATED state to be deactivated!`);
            throw new ConflictException('Profile is not in ACTIVATED state to be deactivated!');
        }

        assert(profile.active);
        profile.active = false;

        let activateOn: Date;
        switch (deactivateFor) {
            case ProfileDeactivationDuration.ONE_WEEK:
                activateOn = daysAhead(7);
                break;
            case ProfileDeactivationDuration.TWO_WEEKS:
                activateOn = daysAhead(15);
                break;
            case ProfileDeactivationDuration.ONE_MONTH:
                activateOn = daysAhead(30);
                break;
            case ProfileDeactivationDuration.TWO_MONTHS:
                activateOn = daysAhead(60);
                break;
            case ProfileDeactivationDuration.INDEFINITELY:
                activateOn = null;
                break;
            default:
                throw new Error('Choose one of the values from ProfileDeactivationDuration enum');
        }

        let deactivatedProfile = await this.deactivatedProfileRepository.findOne(profile.id);
        assert(!deactivatedProfile, `deactivatedProfile should not exist for an active profile. Profile Id: ${profile.id}`);

        deactivatedProfile = this.deactivatedProfileRepository.create({
            profile: profile,
            deactivatedOn: new Date(),
            activateOn
        });

        telegramProfile.status = UserStatus.DEACTIVATED;

        try {
            profile = await this.profileRepository.save(profile);
            await this.telegramRepository.save(telegramProfile);
            await this.deactivatedProfileRepository.save(deactivatedProfile);
        } catch (error) {
            logger.error(`Could not deactivate profile. Error:\n${JSON.stringify(error)}`);
            throw error;
        }

        return profile;
    }


    // TODO: test
    @Transactional()
    async reactivateProfile(telegramUserId: number): Promise<Profile | undefined> {
        logger.log(`reactivateProfile(telegramUserId: ${telegramUserId}): start`);
        const telegramProfile = await this.getTelegramProfileByTelegramUserId(telegramUserId, { throwOnFail: true, relations: ['profile'] });

        let profile = telegramProfile.profile;
        assert(!(profile.active));
        profile.active = true;

        if (telegramProfile.status !== UserStatus.DEACTIVATED) {
            logger.error(`Conflict - Profile with id: ${telegramProfile.id} is not in DEACTIVATED state to be activated!`);
            throw new ConflictException('Profile is not in DEACTIVATED state to be activated!');
        }

        telegramProfile.status = UserStatus.ACTIVATED;

        try {
            profile = await this.profileRepository.save(profile);
            await this.telegramRepository.save(telegramProfile);
            await this.deactivatedProfileRepository.delete(profile.id);
        } catch (error) {
            logger.error(`Could not reactivate profile. Error:\n${JSON.stringify(error)}`);
            throw error;
        }

        return profile;
    }


    // TODO: test
    @Transactional()
    async batchReactivateProfiles() {
        logger.log(`batchReactivateProfiles(): start`);

        const today = new Date();
        today.setHours(23, 59, 59);

        const count = await this.deactivatedProfileRepository
            .createQueryBuilder('d_profile')
            .where('d_profile.activateOn <= :today', { today })
            .getCount();

        const profileQuery = this.profileRepository
            .createQueryBuilder('profile');

        profileQuery.where(qb => {
            const subQuery = qb.subQuery()
                .select("deactivated_profile.id")
                .from(DeactivatedProfile, "deactivated_profile")
                .where("deactivated_profile.activateOn <= :today")
                .getQuery();
            return "profile.id IN " + subQuery;
        });
        profileQuery.setParameter("today", today);

        const telegramProfileQuery = this.telegramRepository
            .createQueryBuilder('tel_profile');

        telegramProfileQuery.where(qb => {
            const subQuery = qb.subQuery()
                .select("deactivated_profile.id")
                .from(DeactivatedProfile, "deactivated_profile")
                .where("deactivated_profile.activateOn <= :today")
                .getQuery();
            return "tel_profile.id IN " + subQuery;
        });
        telegramProfileQuery.setParameter("today", today);

        try {
            await profileQuery.update()
                .set({ active: true })
                .execute();

            await telegramProfileQuery.update()
                .set({ status: UserStatus.ACTIVATED })
                .execute();

            // delete from deactivated_profile table
            await this.deactivatedProfileRepository.delete({ activateOn: LessThanOrEqual(today) });

            logger.log(`batch-reactivated ${count} profiles.`);
        }
        catch (error) {
            logger.error(`Could not activate profiles. Error:\n${JSON.stringify(error)}`);
            throw error;
        }
    }


    @Transactional()
    async batchDeleteProfiles() {
        logger.log('batchDeleteProfiles():: start');

        const today = new Date();
        today.setHours(23, 59, 59);

        const count = await this.toDeleteProfileRepository.count({
            where: { deleteOn: LessThanOrEqual(today) }
        });

        let skip = 0, step = 1000, take = step;
        while (skip < count) {
            // const toDeleteProfiles = await this.toDeleteProfileRepository.find({
            //     where: { deleteOn: LessThanOrEqual(today) },
            //     skip, take
            // });
            const toDeleteProfileIds = await this.toDeleteProfileRepository.query(
                `SELECT id FROM ProfileMarkedForDeletion WHERE deleteOn <= ${today}`
            );

            if (toDeleteProfileIds?.length) {
                try {
                    // Update, not delete, telegram profiles
                    await this.telegramRepository.createQueryBuilder('t_profile')
                        .whereInIds(toDeleteProfileIds)
                        .update('t_profile.status = :status', { status: UserStatus.DELETED }).execute();

                    // delete profile
                    await this.profileRepository.createQueryBuilder()
                        .whereInIds(toDeleteProfileIds).softDelete().execute();

                    // delete preference
                    await this.prefRepository.createQueryBuilder()
                        .whereInIds(toDeleteProfileIds).softDelete().execute();

                    // delete documents
                    await this.documentRepository.createQueryBuilder('document')
                        .where('document.telegramProfileId IN (:...ids)',
                            { ids: toDeleteProfileIds }).softDelete().execute();

                    // delete matches
                    await this.matchRepository.createQueryBuilder('match')
                        .where('match.maleProfileIds IN (: ...ids)',
                            { ids: toDeleteProfileIds })
                        .orWhere('match.femaleProfileIds IN (: ...ids)',
                            { ids: toDeleteProfileIds })
                        .softDelete().execute();

                    // delete from deactivated profile repo
                    await this.deactivatedProfileRepository.createQueryBuilder()
                        .whereInIds(toDeleteProfileIds).softDelete().execute();

                    // delete from to-delete profile repo
                    await this.toDeleteProfileRepository.createQueryBuilder()
                        .whereInIds(toDeleteProfileIds).softDelete().execute();

                }
                catch (error) {
                    logger.error(`Could not batch delete profiles. Error:\n${JSON.stringify(error)}`);
                    throw error;
                }
            }

            skip += step;
            take += step;
        }
        logger.log(`batch deleted ${count} profiles`);
    }


    @Transactional()
    async banProfile(telegramProfileId: string, banInput: BanProfileDto, agent: WbAgent) {
        const telegramProfile = await this.getTelegramProfileById(telegramProfileId, { throwOnFail: true });
        try {
            telegramProfile.status = UserStatus.BANNED;
            telegramProfile.bannedOn = new Date();
            telegramProfile.bannedBy = agent;
            telegramProfile.reasonForBan = banInput.reasonForBan;
            telegramProfile.banDescription = banInput.banDescription;
            await this.telegramRepository.save(telegramProfile);

            await this.softDeleteProfile(telegramProfile.telegramUserId,
                ProfileDeletionReason.Ban);
        }
        catch (error) {
            logger.error(`Could not ban profile. Error:\n${JSON.stringify(error)}`);
            throw error;
        }
    }


    // TODO: test
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


    // TODO: test
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
        return this.getTelegramProfileById(profile.id, {
            throwOnFail: true,
            relations: ['bioData', 'picture', 'idProof']
        });
    }


    async sendMatch(match: Match) {
        if (!match?.maleProfile || !match.femaleProfile) {
            throw new Error('Match object does not contain male or/and female profiles');
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
    }


    async createTelegramProfile(telegramChatId: number, telegramUserId: number, phone?: string): Promise<TelegramProfile | undefined> {
        if (!telegramUserId || !telegramChatId) {
            throw new BadRequestException('Requires non empty telegramUserId and chatId');
        }
        let telegramProfile = await this.telegramRepository.findOne({
            where: [
                { phone },
                { telegramUserId },
                { telegramUserId }
            ]
        })
        if (!telegramProfile) {
            telegramProfile = this.telegramRepository.create({
                telegramChatId,
                telegramUserId,
                phone,
                status: !!phone ? UserStatus.PHONE_VERIFIED : UserStatus.UNREGISTERED
            })
            telegramProfile = await this.telegramRepository.save(telegramProfile);
            logger.log(`Created new telegram profile!`);
        } else {
            throw new ConflictException('Telegram profile already exists!');
        }

        // logger.log(`Returning telegram profile:`, JSON.stringify(telegramProfile));
        return telegramProfile;
    }


    // TODO: update
    async getTelegramProfilesForVerification(skip = 0, take = 20): Promise<IList<TelegramProfile> | undefined> {

        if (take < 1 || take > 100) {
            throw new Error('1 ≤ take ≥ 100');
        }


        const query = this.telegramRepository.createQueryBuilder('tel_profile');
        query.leftJoin('tel_profile.profile', 'profile')
            .where('profile.createdOn IS NULL')

        const [telegramProfiles, count] = await query.skip(skip).take(take).getManyAndCount();

        return {
            count,
            values: telegramProfiles
        };
    }


    // TODO: update
    async getTelegramProfilesForUpdation(skip = 0, take = 20): Promise<IList<TelegramProfile> | undefined> {

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


    // async getTelegramProfiles(options?: GetTelegramProfilesOption, skip = 0, take = 20): Promise<IList<TelegramProfile> | undefined> {

    //     if (take < 1 || take > 100) {
    //         throw new Error('1 ≤ take ≥ 100');
    //     }

    //     const { isValid, withPhone, withBio, withPhoto, withIdProof } = options;
    //     const query = this.telegramRepository.createQueryBuilder('tel_profile');

    //     // TODO: Implement using INTERSECT clause within sub-queries and fix this.
    //     if (!isNil(withPhoto) || !isNil(withIdProof)) {
    //         throw new NotImplementedException('withPhoto and withIdProof options are not yet implemented!')
    //         /**
    //          * TODO: Refactor documents into separate tables - BioData, IdProof, 
    //          * Picture, etc. This will allow join to create a single row, e.g.
    //          * (id1, chatId1, phone1, idProof1, bio1, photo1)
    //          *  BUT if we have all docTypes in one document, then we get multi-row
    //          *  join for each id, e.g. (which is harder to query bcz of attributes
    //          *  being in separate rows.)
    //          *  [   
    //          *      (id2, chatId2, phone2, bio2),
    //          *      (id2, chatId2, phone2, photo2),
    //          *      (id2, chatId2, phone2, idProof2),
    //          *  ]
    //          */
    //     }

    //     if (!isNil(withBio) || !isNil(withPhoto) || !isNil(withIdProof))
    //         query.leftJoin('tel_profile.documents', 'document');

    //     if (!isNil(isValid))
    //         query.where('tel_profile.isValid = :isValid', { isValid });

    //     if (!isNil(withPhone) && withPhone === false)
    //         query.andWhere('tel_profile.phone IS NULL');
    //     else if (withPhone)
    //         query.andWhere('tel_profile.phone IS NOT NULL');

    //     if (withBio)
    //         query.andWhere('document.typeOfDocument = :docTypeBio', { docTypeBio: TypeOfDocument.BIO_DATA });
    //     else if (!isNil(withBio) && withBio === false) {
    //         query.andWhere(qb => {
    //             const subQuery = qb.subQuery()
    //                 .select("t_document.telegramProfileId")
    //                 .from(Document, "t_document")
    //                 .where("t_document.typeOfDocument = :docTypeBio")
    //                 .getQuery();
    //             return "tel_profile.id NOT IN " + subQuery;
    //         })
    //         query.setParameter("docTypeBio", TypeOfDocument.BIO_DATA);
    //     }

    //     // if (withPhoto)
    //     //     query.andWhere('document.typeOfDocument = :docTypePhoto', { docTypePhoto: TypeOfDocument.PICTURE });
    //     // else if (!isNil(withPhoto) && withPhoto === false) {
    //     //     query.andWhere(qb => {
    //     //         const subQuery = qb.subQuery()
    //     //             .select("t_document.telegramProfileId")
    //     //             .from(Document, "t_document")
    //     //             .where("t_document.typeOfDocument = :docTypePhoto")
    //     //             .getQuery();
    //     //         return "tel_profile.id NOT IN " + subQuery;
    //     //     })
    //     //     query.setParameter("docTypePhoto", TypeOfDocument.PICTURE);
    //     // }

    //     // if (withIdProof)
    //     //     query.andWhere('document.typeOfDocument = :docTypeId', { docTypeId: TypeOfDocument.ID_PROOF });
    //     // else if (!isNil(withIdProof) && withIdProof === false) {
    //     //     query.andWhere(qb => {
    //     //         const subQuery = qb.subQuery()
    //     //             .select("t_document.telegramProfileId")
    //     //             .from(Document, "t_document")
    //     //             .where("t_document.typeOfDocument = :docTypeId")
    //     //             .getQuery();
    //     //         return "tel_profile.id NOT IN " + subQuery;
    //     //     })
    //     //     query.setParameter("docTypeId", TypeOfDocument.ID_PROOF);
    //     // }

    //     const [telegramProfiles, count] = await query.skip(skip).take(take).getManyAndCount();

    //     return {
    //         count,
    //         values: telegramProfiles
    //     };
    // }


    async getTelegramProfileById(id: string, {
        throwOnFail = true,
        relations = [],
    }): Promise<TelegramProfile | undefined> {
        const telegramProfile = await this.telegramRepository.findOne(id, {
            relations
        });
        if (throwOnFail && !telegramProfile) {
            logger.log(`Telegram profile with id: ${id} not found!`);
            throw new NotFoundException(`Telegram profile with id: ${id} not found!`);
        }
        return telegramProfile;
    }


    async getTelegramProfileByTelegramUserId(telegramUserId: number, {
        throwOnFail = true,
        relations = []
    }): Promise<TelegramProfile | undefined> {
        const telegramProfile = await this.telegramRepository.findOne({
            where: { telegramUserId },
            relations
        });
        if (throwOnFail && !telegramProfile) {
            throw new NotFoundException(`Telegram profile with telegram user id: ${telegramUserId} not found!`);
        }
        return telegramProfile;
    }


    // async getTelegramProfileByTelegramChatId(telegramChatId: number, {
    //     throwOnFail = true,
    //     relations = []
    // }): Promise<TelegramProfile | undefined> {
    //     const telegramProfile = await this.telegramRepository.findOne({
    //         where: { telegramChatId },
    //         relations
    //     });
    //     if (throwOnFail && !telegramProfile) {
    //         throw new NotFoundException(`Telegram profile with chat id: ${telegramChatId} not found!`);
    //     }
    //     return telegramProfile;
    // }


    async savePhoneNumberForTelegramUser(id: string, phone: string): Promise<TelegramProfile | undefined> {
        if (!phone) {
            throw new Error("Phone number cannot be empty!");
        }
        let telegramProfile = await this.getTelegramProfileById(id, { throwOnFail: true });
        telegramProfile.phone = phone;
        telegramProfile.status = UserStatus.PHONE_VERIFIED;
        return this.telegramRepository.save(telegramProfile);
    }


    // TODO: update
    // async getAllDocuments(options?: GetAllDocumentsOption, skip = 0, take = 20): Promise<IList<Document> | undefined> {
    //     const { telegramProfileId, typeOfDocument } = options;
    //     const [values, count] = await this.documentRepository.findAndCount({
    //         where: { telegramProfileId },
    //         skip,
    //         take
    //     });

    //     return {
    //         count,
    //         values
    //     }
    // }


    // TODO: update
    // async getDocuments(telegramProfileId: string, typeOfDocument: TypeOfDocument): Promise<Document[] | undefined> {
    //     return this.documentRepository.find({
    //         where: { telegramProfileId, typeOfDocument, url: Not(IsNull()) },
    //     });
    // }


    async getDocumentById(id: number, {
        throwOnFail = true,
        relations = [],
    }): Promise<Document | undefined> {
        const document = await this.documentRepository.findOne(id, {
            relations
        });
        if (throwOnFail && !document) {
            logger.log(`Document with id: ${id} not found!`);
            throw new NotFoundException(`Document with id: ${id} not found!`);
        }
        return document;
    }


    // TODO: update
    async getDocument(telegramProfileId: string, typeOfDocument: TypeOfDocument, {
        active = true,
        valid = true,
        throwOnFail = false
    }): Promise<Document | undefined> {
        const where = {
            telegramProfileId,
            typeOfDocument,

        };
        if (!isNil(active)) {
            where['active'] = active;
        }
        if (!isNil(valid)) {
            where['valid'] = valid;
        }

        const document = await this.documentRepository.findOne({
            where: where,
        });

        if (throwOnFail && !document) {
            throw new NotFoundException(`Document with id: ${telegramProfileId} and docType: ${typeOfDocument} does not exist!`);
        }

        return document;
    }


    // TODO: test
    @Transactional()
    async uploadDocument(telegramUserId: number, fileName: string, dir: string, contentType: string, typeOfDocument: TypeOfDocument, telegramFileId: string, typeOfIdProof?: TypeOfIdProof): Promise<Document | undefined> {
        let relation;
        switch (typeOfDocument) {
            case TypeOfDocument.BIO_DATA:
                relation = 'unverifiedBioData';
                break;
            case TypeOfDocument.PICTURE:
                relation = 'unverifiedPicture';
                break;
            case TypeOfDocument.ID_PROOF:
                relation = 'unverifiedIdProof';
                break;
            default:
                throw new NotImplementedException('unhandled');
        }

        const telegramProfile = await this.getTelegramProfileByTelegramUserId(telegramUserId, { throwOnFail: true, relations: [relation] });

        // let unverifiedDocument = await this.documentRepository.findOne({
        //     where: { telegramProfileId: telegramProfile.id, typeOfDocument: typeOfDocument, isValid: IsNull(), fileName: Not(IsNull()) },
        // });

        const unverifiedDocument = telegramProfile[relation];

        try {
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

            switch (typeOfDocument) {
                case TypeOfDocument.BIO_DATA:
                    telegramProfile.unverifiedBioData = document;
                    if (telegramProfile.status === UserStatus.PHONE_VERIFIED
                        || telegramProfile.status === UserStatus.ACTIVATION_FAILED) {
                        telegramProfile.status = UserStatus.ACTIVATION_PENDING;
                    }
                    break;
                case TypeOfDocument.PICTURE:
                    telegramProfile.unverifiedPicture = document;
                    break;
                case TypeOfDocument.ID_PROOF:
                    telegramProfile.unverifiedIdProof = document;
                    break;
                default:
                    throw new NotImplementedException('Unhandled');
            }

            await this.telegramRepository.save(telegramProfile);

            // Now delete old unverified document from aws S3 and document table
            if (unverifiedDocument) {
                assert(unverifiedDocument.id !== document.id)
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
            logger.error(`Could not upload document. Error:\n${JSON.stringify(error)}`);
            throw error;
        }
    }


    async downloadDocument(documentId: number, typeOfDocument: TypeOfDocument, dir: string): Promise<string | undefined> {

        // const telegramProfile = await this.getTelegramProfileByTelegramUserId(telegramUserId, { throwOnFail: true });

        // const document = await this.getDocument(telegramProfile.id, typeOfDocument, { throwOnFail: true, active: null, valid: null });

        const document = await this.getDocumentById(documentId, {
            throwOnFail: true,
        });

        if (!document.fileName)
            throw new Error('This document does not exist on AWS!');

        return this.awsService.downloadFileFromS3(document.fileName, typeOfDocument, dir);
    }


    async getInvalidatedDocumentCausingProfileInvalidation(telegramProfileId: string, typeOfDocument = TypeOfDocument.BIO_DATA): Promise<Document | undefined> {
        const document = await this.documentRepository.findOne({
            where: { telegramProfileId, typeOfDocument, isValid: false },
            order: { createdOn: 'DESC' }
        });
        const validateDocument = await this.documentRepository.findOne({
            where: { telegramProfileId, typeOfDocument, isValid: true },
            order: { createdOn: 'DESC' }
        });
        if (validateDocument) {
            return null;
        }
        return document;
    }


    @Transactional()
    async validateDocument(validationInput: DocumentValidationDto, agent: WbAgent): Promise<Document | undefined> {
        const { documentId, valid, rejectionReason, rejectionDescription } = validationInput;
        try {
            let document = await this.documentRepository.findOne(documentId);
            document = await this.getDocumentById(documentId, {
                throwOnFail: true,
                relations: ['telegramProfile']
            });

            const telegramProfile = document.telegramProfile;

            document.isActive = valid;
            document.isValid = valid;
            document.invalidationReason = rejectionReason;
            document.invalidationDescription = rejectionDescription;
            document.verifierId = agent.id;
            document.verifiedOn = new Date();

            // Mark this document as active doc in telegram profile for that doc type
            switch (document.typeOfDocument) {
                case TypeOfDocument.BIO_DATA:
                    telegramProfile.unverifiedBioData = null;
                    if (valid)
                        telegramProfile.bioDataId = document.id;

                    if (telegramProfile.status === UserStatus.ACTIVATION_PENDING) {
                        telegramProfile.status = valid
                            ? UserStatus.ACTIVATED
                            : UserStatus.ACTIVATION_FAILED
                    }
                    break;
                case TypeOfDocument.PICTURE:
                    telegramProfile.unverifiedBioData = null;
                    if (valid)
                        telegramProfile.pictureId = document.id;
                    break;
                case TypeOfDocument.ID_PROOF:
                    telegramProfile.unverifiedBioData = null;
                    if (valid)
                        telegramProfile.idProofId = document.id;
                    break;
                case TypeOfDocument.VIDEO:
                case TypeOfDocument.REPORT_ATTACHMENT:
                default:
                    throw new NotImplementedException('Not implemented!');
            }

            if (valid) {
                // find old active document, mark as inactive and delete from AWS in the end
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

            // Caution: save here! 
            // cannot save before marking the old active document inactive.
            document = await this.documentRepository.save(document);

            return document;
        }
        catch (error) {
            logger.error(`Could not verify document. Error:\n${JSON.stringify(error)}`);
            throw error;
        }
    }


    // async generateS3SignedURLs(telegramProfileId: string,
    //     fileName: string,
    //     typeOfDocument: TypeOfDocument): Promise<string | undefined> {

    //     const urlObj = await this.awsService.createSignedURL(telegramProfileId, fileName, typeOfDocument, false);

    //     return urlObj.preSignedUrl;
    // }


    // TODO: Refactor -- This method cannot decide which document to send
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
        let savedCastes: Caste[] = [];
        try {
            savedCastes = await this.casteRepository.save(castes);
        } catch (error) {
            logger.error(`Could not create castes. Error: ${JSON.stringify(error)}`);
        }
        return savedCastes;
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


    async getReferee(payload: string): Promise<[Referee, null | TelegramProfile | WbAgent]> {
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


    async getRegistrationAction(telegramProfileId: string): Promise<RegistrationActionRequired | undefined> {
        // const telegramProfile = await this.telegramRepository.findOne(telegramProfileId, { relations: ['documents'] });

        // if (!telegramProfile) {
        //     logger.log(`getRegistrationStatus(): profile ${telegramProfile} not registered!`);
        //     throw new NotFoundException(`Telegram profile with id: ${telegramProfile.id} not found!`);
        // }

        const telegramProfile = await this.getTelegramProfileById(telegramProfileId, { throwOnFail: true });

        if (!telegramProfile.phone) {
            return RegistrationActionRequired.VERIFY_PHONE;
        }

        const documents: Document[] = telegramProfile.documents;
        if (!documents?.length) {
            return RegistrationActionRequired.UPLOAD_BIO_AND_PICTURE;
        }
        else {
            let bioRequired = true, bioVerified = false,
                picRequired = true, picVerified = false;
            for (let doc of documents) {
                if (doc.typeOfDocument === TypeOfDocument.BIO_DATA && doc.isValid !== false) {
                    bioRequired = false;
                    if (doc.isValid) {
                        bioVerified = true;
                    }
                } else if (doc.typeOfDocument === TypeOfDocument.PICTURE && doc.isValid !== false) {
                    picRequired = false;
                    if (doc.isValid) {
                        picVerified = true;
                    }
                }
            }
            if (bioRequired && picRequired) {
                return RegistrationActionRequired.UPLOAD_BIO_AND_PICTURE;
            } else if (picRequired) {
                return RegistrationActionRequired.UPLOAD_PICTURE;
            } else if (bioRequired) {
                return RegistrationActionRequired.UPLOAD_BIO;
            } else { // if (!bioRequired && !picRequired) {
                return RegistrationActionRequired.NONE;
            }
        }
    }


    async getActiveSupportTicket(telegramProfileId: string): Promise<Support | undefined> {
        return this.supportRepository.findOne({
            where: { telegramProfileId, resolved: false }
        });
    }


    async userCloseActiveSupportTicket(telegramProfileId: string) {
        const activeSupportTicket = await this.getActiveSupportTicket(telegramProfileId);
        if (!activeSupportTicket) {
            throw new NotFoundException(`No active support ticket was found for Telegram profile with id: ${telegramProfileId}`);
        }
        await this.supportRepository.delete(activeSupportTicket);
    }


    async createSupportTicket(telegramProfileId: string, description: string): Promise<Support | undefined> {
        const telegramProfile = await this.getTelegramProfileById(telegramProfileId, { throwOnFail: true });

        const activeSupportTicket = await this.getActiveSupportTicket(telegramProfileId);

        if (activeSupportTicket) {
            throw new ConflictException('One Support Ticket is already open. Cannot Open another.');
        }

        const supportTicket = this.supportRepository.create({
            telegramProfileId: telegramProfileId,
            issueDescription: description
        });

        return this.supportRepository.save(supportTicket);
    }


    async resolveSupportTicket(ticketId: number, supportResolutionDto: SupportResolutionDto, agent: WbAgent): Promise<Support | undefined> {
        const supportTicket = await this.supportRepository.findOne(ticketId);
        if (!supportTicket) {
            throw new NotFoundException(`No support ticket was found for ticket id: ${ticketId}`);
        }

        const { category, resolution } = supportResolutionDto;

        supportTicket.resolved = true;
        supportTicket.resolvedOn = new Date();
        supportTicket.resolvedBy = agent;
        supportTicket.category = category;
        supportTicket.resolution = resolution;

        return this.supportRepository.save(supportTicket);
    }


    // Common data

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

        if (pattern) {
            query.where("state.name ILIKE :pattern", { pattern: `%${pattern}%` });
        }

        if (countryIds?.length) {
            query.andWhere("state.countryId IN (:...countryIds)", { countryIds });
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

        if (pattern) {
            query.where("country.name ILIKE :pattern", { pattern: `%${pattern}%` });
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

        if (pattern) {
            query = query.where("city.name ILIKE :pattern", { pattern: `${pattern}%` });
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


    /**
     * Cron Task Schedulers
     */

    // ref- https://crontab.guru/#15_8-20/3_*_*_*
    @Cron('*/16 5 8-21/3 * * *')   // try every 16 second of 5th minute
    // @Cron('*/10 * 8-21/3 * * *')
    async queueSendProfilesTask() {
        logger.debug('Scheduling send-profiles task');
        const jobId = (new Date()).setSeconds(0, 0);
        // setting job-id equal to date value up to minute ensure that duplicate values added in the minute (every 16th second) are not added. This is done to make it more probable that the task gets scheduled at least once (at 16th, 32nd, or 48th second) and at most once.
        await this.schedulerQueue.add({ task: 'send-profiles' }, { jobId })
    }


    @Cron('1 31 2 * * *')   // try everyday at 02:31:01 am
    async queueProfileMaintenanceTasks() {
        logger.debug('Scheduling activate-profiles task');
        const jobId = (new Date()).setSeconds(0, 0);
        // setting job-id equal to date value up to minute ensure that duplicate values added in the minute (every 16th second) are not added. This is done to make it more probable that the task gets scheduled at least once (at 16th, 32nd, or 48th second) and at most once.
        await this.schedulerQueue.add({ task: 'reactivate-profiles' }, { jobId });
        await this.schedulerQueue.add({ task: 'delete-profiles' }, { jobId });
    }
}