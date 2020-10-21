import json
import os
import pathlib
import psycopg2

# current_path = pathlib.Path.cwd()
file_path = pathlib.Path(
    '../') / 'countries-states-cities-database-master' / 'countries+states+cities.json'

conn = psycopg2.connect(host='localhost',
                        port="5432",
                        dbname='telegram',
                        user='developer',
                        password='dbonfire')

cur = conn.cursor()

country_query = 'INSERT INTO country (id, name, iso3, iso2, "phoneCode") VALUES (%s, %s, %s, %s, %s)'

state_query = 'INSERT INTO state (id, name, "stateCode", "countryId") VALUES (%s, %s, %s, %s)'

# city_query = 'INSERT INTO city (id, name, "stateId") VALUES (%s, %s, %s)'
city_query = 'INSERT INTO city (id, name, latitude, longitude, "stateId") VALUES (%s, %s, %s, %s, %s)'

countries_to_add = ['india', 'canada', 'united states', 'argentina', 'chile',
                    'australia', 'new zealand',
                    'finland', 'sweden', 'denmark', 'norway',
                    'united kingdom',  'portugal', 'spain', 'france', 'germany', 'netherlands the', 'switzerland', 'austria',
                    'belgium', 'czech republic', 'ireland', 'poland', 'russia',
                    'brunei', 'oman', 'qatar', 'saudi arabia', 'south africa',  'united arab emirates',
                    'china', 'nepal',  'japan', 'korea south', 'singapore', ]

# open the csv file using python standard file I/O
with open(file_path, 'r', encoding="utf8") as f:
    data = json.loads('{\n"countries": ' + f.read() + '\n}')
    countries = data['countries']
    # print(len(countries))
    for country in countries:
        # print(country["name"], len(country["states"]))

        if country["name"].lower() not in countries_to_add:
            continue
        else:
            print(country["name"].lower(), country["phone_code"])

        cur.execute(country_query, (country["id"], country["name"],
                                    country["iso3"], country["iso2"], country["phone_code"]))
        states = country["states"]
        # print('\t', 'states:', states)
        for state in states:
            # print('\t', state["name"], len(state["cities"]))
            # print('\t', state)
            cur.execute(
                state_query, (state["id"], state["name"], state["state_code"], country["id"]))
            cities = state["cities"]
            for city in cities:
                cur.execute(
                    city_query, (city["id"], city["name"],
                                 city["latitude"], city["longitude"], state["id"])
                )
                # print('\t\t', city["name"])
                # print('\n')
            conn.commit()

conn.commit()
cur.close()
conn.close()
