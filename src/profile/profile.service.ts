import { Injectable, UnauthorizedException, Logger, BadRequestException, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Gender, Religion } from 'src/common/enum';
import { getAgeInYearsFromDOB } from 'src/common/util';
import { Repository } from 'typeorm';
import { TelegramAuthenticateDto } from './dto/telegram-auth.dto';
import { PartnerPreferenceDto, CreateUserDto, CreateProfileDto } from './dto/profile.dto';
import { Caste } from './entities/caste.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { PartnerPreference } from './entities/partner-preference.entity';
import { Profile } from './entities/profile.entity';
import { State } from './entities/state.entity';
import { User } from './entities/user.entity';
import { GetCityOptions, GetStateOptions } from './profile.interface';
import { createHash, createHmac } from 'crypto';
import { TelegramProfile } from './entities/telegram-profile.entity';
import { SharedProfile } from './entities/shared-profiles.entity';

const logger = new Logger('ProfileService');

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Profile) private profileRepository: Repository<Profile>,
        @InjectRepository(TelegramProfile) private telegramRepository: Repository<TelegramProfile>,
        @InjectRepository(SharedProfile) private sharedProfileRepository: Repository<SharedProfile>,
        @InjectRepository(PartnerPreference) private prefRepository: Repository<PartnerPreference>,
        @InjectRepository(Caste) private casteRepository: Repository<Caste>,
        @InjectRepository(City) private cityRepository: Repository<City>,
        @InjectRepository(State) private stateRepository: Repository<State>,
        @InjectRepository(Country) private countryRepository: Repository<Country>,
    ) { }


    checkTelegramAuth(auth: TelegramAuthenticateDto): boolean {
        if (!process.env.BOT_TOKEN) {
            throw new InternalServerErrorException('Telegram Bot token is not set!');
        }
        console.log('auth:', JSON.stringify(auth));
        const now = Date.now() / 1000;
        const timeDiff = now - parseInt(auth.auth_date);
        console.log('now:', now, 'timeDiff:', timeDiff);

        const checkString: string = Object.keys(auth)
            .filter(key => key !== 'hash')
            .map(key => `${key}=${auth[key]}`)
            .sort()
            .join('\n');

        const secret = createHash('sha256')
            .update(process.env.BOT_TOKEN)
            .digest();

        const hash = createHmac('sha256', secret)
            .update(checkString)
            .digest('hex');

        return auth.hash === hash; // && timeDiff < constants.telegram.authExpiresIn;
    }


    async sendMessage(): Promise<boolean> {
        return true;
    }


    async getUsers(): Promise<User[] | undefined> {
        return this.userRepository.find();
    }


    async getUserByPhone(phone: string, throwOnFail = true): Promise<User | undefined> {
        // const user = await this.userRepository.findOne({
        //     where: { phone: phone }
        // });
        // if (throwOnFail && !user) {
        //     throw new NotFoundException(`user with phone: ${phone} not found!`);
        // }
        // return user;

        const user = await this.userRepository.createQueryBuilder("user")
            .leftJoinAndSelect("user.country", 'country')
            .where("country.phoneCode || user.phone LIKE :phone",
                { phone }).getOne();
        // .orWhere("user.phone LIKE :phone",
        //     { phone: `phone` }).getOne();
        if (throwOnFail && !user) {
            throw new NotFoundException(`user with phone: ${phone} not found!`);
        }
        return user;
    }


    async getUser(id: string, throwOnFail = true): Promise<User | undefined> {
        const user = await this.userRepository.findOne(id);
        if (throwOnFail && !user) {
            throw new NotFoundException('user not found!');
        }
        return user;
    }


    async createUser(userInput: CreateUserDto): Promise<User | undefined> {
        const { email, phone, countryId } = userInput;

        let country: Country;
        if (!countryId) {
            country = await this.getCountryByName('India', true);
        } else {
            country = await this.getCountry(countryId, true);
        }

        console.log('country:', country);

        let user = await this.userRepository.findOne({
            where: [
                { email: email },
                { phone: phone }
            ]
        });
        if (user) {
            throw new ConflictException('user with email/phone already exists!');
        }

        user = this.userRepository.create({
            email,
            country,
            phone
        });
        return this.userRepository.save(user);
    }


    async createProfile(profileDto: CreateProfileDto): Promise<Profile | undefined> {
        const { userId, name, gender, dob, religion, casteId, annualIncome, cityId } = profileDto;
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


    async getTelegramProfile(userId: string, throwOnFail = true): Promise<TelegramProfile | undefined> {
        const telegramProfile = await this.telegramRepository.findOne(userId);
        if (throwOnFail && !telegramProfile) {
            throw new NotFoundException(`Telegram profile with id: ${userId} not found!`);
        }
        return telegramProfile;
    }


    async getORCreateTelegramProfile(phone: string, telegramUserId: number, telegramChatId: number): Promise<TelegramProfile | undefined> {
        const user = await this.getUserByPhone(phone, true);
        logger.log(`getORCreateTelegramProfile(), user:`, JSON.stringify(user));

        if (!telegramUserId || !telegramChatId) {
            throw new BadRequestException('Requires non empty telegramUserId and chatId');
        }
        let telegramProfile = await this.getTelegramProfile(user.id, false);
        if (!telegramProfile) {
            telegramProfile = this.telegramRepository.create({
                id: user.id,
                telegramUserId,
                telegramChatId
            });
            telegramProfile = await this.telegramRepository.save(telegramProfile);
            logger.log(`Created telegram profile for user`);
        }
        logger.log(`returning telegram profile:`, JSON.stringify(telegramProfile));
        return telegramProfile;
    }


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


    async getCaste(casteId: number, throwOnFail = false): Promise<Caste | undefined> {
        const caste = await this.casteRepository.findOne(casteId);
        if (throwOnFail && !caste) {
            throw new NotFoundException(`Caste with id: ${casteId} not found!`);
        }
        return caste;
    }

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
            throw new NotFoundException(`City with id: {cityId} not found`);
        }

        return state;
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


    async getCountry(countryId: number, throwOnFail = false): Promise<Country | undefined> {
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
        take = 100): Promise<Country[]> {

        const query = this.countryRepository.createQueryBuilder("country");
        // let whereIsSet: boolean = false

        if (pattern !== null && pattern.trim() !== "") {
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


    // defining named parameters
    // ref: https://medium.com/better-programming/named-parameters-in-typescript-e32c763d2b2e#:~:text=Even%20though%20there%20is%20technically,play%20with%20letters%20in%20Scrabble.
    async getCitiesLike(pattern: string,
        {
            stateId = null,
            countryId = null,
            skip = 0,
            take = 100
        }): Promise<City[]> {

        let query = this.cityRepository.createQueryBuilder("city");
        let whereIsSet: boolean = false

        if (pattern !== null && pattern.trim() !== "") {
            // query = query.where("city.name ILIKE :pattern", { pattern: `%${pattern}%` });
            query = query.where("city.name ILIKE :pattern", { pattern: `${pattern}%` });
            whereIsSet = true;
        }

        if (stateId) {
            query = whereIsSet ? query.andWhere("city.stateId = :stateId", { stateId: stateId }) : query.where("city.stateId = :stateId", { stateId: stateId });
            whereIsSet = true;
        }
        // TODO: test - search restricted to a country probably doesn't yet work.
        else if (countryId) {
            query = whereIsSet ? query.leftJoin("city.state", "state")
                .andWhere("state.countryId = :countryId", { countryId: countryId }) : query.leftJoin("city.state", "state")
                    .where("state.countryId = :countryId", { countryId: countryId });
        }

        return query.skip(skip).take(take).getMany();
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
            throw new NotFoundException(`City with id: {cityId} not found`);
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
}