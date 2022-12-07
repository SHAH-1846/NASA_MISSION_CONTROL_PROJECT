const launchesDatabase = require('./launches.mongo');

const planets = require('./planets.mongo');

const axios = require('axios');
// const { findOne } = require('./launches.mongo');

// const launches=new Map();

const DEFAULT_FLIGHT_NUMBER = 100;


// latestFlightNumber = 100;
// launches.set(launch.flightNumber,launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';


async function populateLaunches() {
    console.log('Downloading launch data...');
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        'customers': 1
                    }
                }
            ]
        }
    })

    if (response.status !== 200) {
        console.log('Problem downloading launch data');
        throw new Error('Launch data download failed');
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,// or customers:customers
        }

        console.log(`${launch.flightNumber} : ${launch.mission}!`)

        await saveLaunch(launch);
    }
}

async function loadLaunchData() {

    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat',
    });

    if (firstLaunch) {
        console.log("Launch data already loaded...");
        return;
    } else {
        await populateLaunches();

    }
    

}

async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter);
}

async function getAllLaunches(skip,limit) {
    //  return Array.from(launches.values());
    return await launchesDatabase
        .find({}, {
            '_id': 0,
            '__v': 0,
        })
        .sort({flightNumber:1})
        .skip(skip)
        .limit(limit);
};


async function saveLaunch(launch) {


    await launchesDatabase.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, {
        upsert: true,
    })
};

async function existsLaunchWithId(launchId) {
    return await launchesDatabase.findOne({
        flightNumber: launchId,
    });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');

    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}


// function addNewLaunch(launch){
//     latestFlightNumber++;
//     launches.set(latestFlightNumber,Object.assign(launch,{
//         success:true,
//         upcoming:true,
//         customers:['Zero to Mastery','NASA'],
//         flightNumber:latestFlightNumber,
//     }));
// };

async function scheduleNewLaunch(launch) {

    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if (!planet) {
        throw new Error("No matching planet found");
    }

    const newFlightNumber = await getLatestFlightNumber() + 1;

    const newLaunch = Object.assign(launch, {
        upcoming: true,
        success: true,
        customers: ['Zero to Mastery', 'NASA'],
        flightNumber: newFlightNumber,
    });

    await saveLaunch(newLaunch);
};

async function abortLaunchById(launchId) {
    // const aborted=launches.get(launchId);
    // aborted.upcoming=false;
    // aborted.success=false;
    // return aborted;

    const aborted = await launchesDatabase.updateOne({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false,
    });

    return aborted.modifiedCount === 1;

}


module.exports = {
    loadLaunchData,
    getAllLaunches,
    existsLaunchWithId,
    abortLaunchById,
    scheduleNewLaunch,
}


