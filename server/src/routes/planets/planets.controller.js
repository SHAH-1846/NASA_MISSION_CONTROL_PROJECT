const {getAllPlanets} = require('../../models/planets.model');

async function httpGetAllPlanets(req, res) {

    // console.log("From Planets.Controller: ",habitablePlanets);
    return  res.status(200).json(await getAllPlanets());

};
// getAllPlanets();

// const getAllPlanets1=getAllPlanets();

// console.log("From Planets Controller:",getAllPlanets());

module.exports={
    httpGetAllPlanets,
};