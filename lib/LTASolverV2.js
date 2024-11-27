var RPHelper = require("./RPHelper");
var moment = require("moment");
var LTAHeadless = require("./LTAHeadlessV2");

exports.healthcheck = function(req, res) {
	res.send({success: true});
}

exports.getCarV1 = function(req, res) {
	var data = RPHelper.getFields(req.body, [
		"license_plate",
    	"owner_id",
    	"owner_id_type",
    	"country_cd",
		"intended_transfer_date"
  	]);
	

  	if (data.license_plate) {
    	data.license_plate = data.license_plate.trim().toUpperCase();
  	}

  	if (data.owner_id) {
    	data.owner_id = data.owner_id.trim().toUpperCase();
  	}

	getCarV1(data.license_plate, data.owner_id, data.owner_id_type, data.country_cd, data.intended_transfer_date).then(function (car) {
		res.send(car);
	}, function(err){
		res.status(400).send({ error: err });
	});
}

function getCarV1(licensePlate, ownerId, ownerIdType, countryCd, transferDate) {
	var vehicleData = {
		license_plate: licensePlate,
		owner_id: ownerId,
		owner_id_type: ownerIdType,
		country_cd: countryCd
	}

	if (transferDate){
		var checkDate = moment(transferDate, "DDMMYYYY").utcOffset(8);
		var startOfToday = moment().utcOffset(8).startOf('day');
		if (checkDate && checkDate >= startOfToday){
			vehicleData.intended_transfer_date = transferDate;
		}
		else {
			return Promise.reject("transfer_date_error");
		}
	}
	else {
		vehicleData.intended_transfer_date = moment().add("1", "day").format("DDMMYYYY");
	}

	console.log("Getting vehicle information for:", vehicleData);

	var rebateData = {}
	var transferData = {}
	var roadtaxData = {}

	return new Promise(function (resolve, reject) {
		return LTAHeadless.getRebateInfo(vehicleData).then((data) => {
			rebateData = data;
			var regDate = moment(rebateData.orig_reg_date,"DD MMM YYYY");
			if (!transferDate) {
				var diff = moment(vehicleData.intended_transfer_date, 'DDMMYYYY').diff(moment(regDate), "months", true);
				
				if (diff < 3) {
					vehicleData.intended_transfer_date = moment(regDate).add("12", "months").format("DDMMYYYY");
				}
			}
			return Promise.all([
				LTAHeadless.getTransferInfoWithRetry(vehicleData, 3),
				LTAHeadless.getRoadTaxInfoWithRetry(vehicleData, 3)
			]);
		})
		.then((data) => {
			transferData = data[0];
			roadtaxData = data[1];
			console.log(rebateData)
			console.log(transferData)
			console.log(roadtaxData)
			var vehicle = parseDataV1(rebateData, transferData, roadtaxData, vehicleData);
			console.log(JSON.stringify(vehicle,null,2));
			resolve(vehicle);
		})
		.catch((error) => {
			console.log(error);
			return reject(error);
		});
	});	
}

exports.getCarQuick = function(req, res) {
	var data = RPHelper.getFields(req.body, [
		"license_plate",
    	"owner_id",
    	"owner_id_type",
    	"country_cd",
		"intended_transfer_date"
  	]);
	

  	if (data.license_plate) {
    	data.license_plate = data.license_plate.trim().toUpperCase();
  	}

  	if (data.owner_id) {
    	data.owner_id = data.owner_id.trim().toUpperCase();
  	}

	getCarQuick(data.license_plate, data.owner_id, data.owner_id_type, data.country_cd, data.intended_transfer_date).then(function (car) {
		res.send(car);
	}, function(err){
		res.status(400).send({ error: err });
	});
}

function getCarQuick(licensePlate, ownerId, ownerIdType, countryCd, transferDate) {
	var vehicleData = {
		license_plate: licensePlate,
		owner_id: ownerId,
		owner_id_type: ownerIdType,
		country_cd: countryCd
	}

	if (transferDate){
		var checkDate = moment(transferDate, "DDMMYYYY").utcOffset(8);
		var startOfToday = moment().utcOffset(8).startOf('day');
		if (checkDate && checkDate >= startOfToday){
			vehicleData.intended_transfer_date = transferDate;
		}
		else {
			return Promise.reject("transfer_date_error");
		}
	}
	else {
		vehicleData.intended_transfer_date = moment().add("1", "day").format("DDMMYYYY");
	}

	console.log("Getting vehicle information for:", vehicleData);

	var transferData = {}
	var roadtaxData = {}

	return new Promise(function (resolve, reject) {
		return Promise.all([
			LTAHeadless.getTransferInfoWithRetry(vehicleData, 3),
			LTAHeadless.getRoadTaxInfoWithRetry(vehicleData, 3)
		])
		.then((data) => {
			transferData = data[0];
			roadtaxData = data[1];
			console.log(transferData)
			console.log(roadtaxData)
			var vehicle = {
				...transferData,
				...roadtaxData
			}
			console.log(JSON.stringify(vehicle,null,2));
			resolve(vehicle);
		})
		.catch((error) => {
			return reject(error);
		});
	});	
}
exports.getCarRebate = function(req, res) {
	var data = RPHelper.getFields(req.body, [
		"license_plate",
    	"owner_id",
    	"owner_id_type",
    	"country_cd",
		"intended_transfer_date"
  	]);
	

  	if (data.license_plate) {
    	data.license_plate = data.license_plate.trim().toUpperCase();
  	}

  	if (data.owner_id) {
    	data.owner_id = data.owner_id.trim().toUpperCase();
  	}

	getCarRebate(data.license_plate, data.owner_id, data.owner_id_type, data.country_cd, data.intended_transfer_date).then(function (car) {
		res.send(car);
	}, function(err){
		res.status(400).send({ error: err });
	});
}

function getCarRebate(licensePlate, ownerId, ownerIdType, countryCd, transferDate) {
	var vehicleData = {
		license_plate: licensePlate,
		owner_id: ownerId,
		owner_id_type: ownerIdType,
		country_cd: countryCd
	}

	if (transferDate){
		var checkDate = moment(transferDate, "DDMMYYYY").utcOffset(8);
		var startOfToday = moment().utcOffset(8).startOf('day');
		if (checkDate && checkDate >= startOfToday){
			vehicleData.intended_transfer_date = transferDate;
		}
		else {
			return Promise.reject("transfer_date_error");
		}
	}
	else {
		vehicleData.intended_transfer_date = moment().add("1", "day").format("DDMMYYYY");
	}

	console.log("Getting vehicle information for:", vehicleData);

	var transferData = {}
	var roadtaxData = {}

	return new Promise(function (resolve, reject) {
		return Promise.all([
			LTAHeadless.getRebateInfo(vehicleData)
		])
		.then((data) => {
			rebateData = data[0];
			console.log(rebateData)
			var vehicle = {
				...rebateData
			}
			console.log(JSON.stringify(vehicle,null,2));
			resolve(vehicle);
		})
		.catch((error) => {
			return reject(error);
		});
	});	
}

exports.getCar = function(req, res) {
	var data = RPHelper.getFields(req.body, [
		"license_plate",
    	"owner_id",
    	"owner_id_type",
    	"country_cd",
		"intended_transfer_date"
  	]);
	

  	if (data.license_plate) {
    	data.license_plate = data.license_plate.trim().toUpperCase();
  	}

  	if (data.owner_id) {
    	data.owner_id = data.owner_id.trim().toUpperCase();
  	}

	getCar(data.license_plate, data.owner_id, data.owner_id_type, data.country_cd, data.intended_transfer_date).then(function (car) {
		res.send(car);
	}, function(err){
		res.status(400).send({ error: err });
	});
}

function getCar(licensePlate, ownerId, ownerIdType, countryCd, transferDate) {
	var vehicleData = {
		license_plate: licensePlate,
		owner_id: ownerId,
		owner_id_type: ownerIdType,
		country_cd: countryCd
	}

	if (transferDate){
		var checkDate = moment(transferDate, "DDMMYYYY").utcOffset(8);
		var startOfToday = moment().utcOffset(8).startOf('day');
		if (checkDate && checkDate >= startOfToday){
			vehicleData.intended_transfer_date = transferDate;
		}
		else {
			return Promise.reject("transfer_date_error");
		}
	}
	else {
		vehicleData.intended_transfer_date = moment().add("1", "day").format("DDMMYYYY");
	}

	console.log("Getting vehicle information for:", vehicleData);

	var rebateData = {}
	var transferData = {}
	var roadtaxData = {}

	return new Promise(function (resolve, reject) {
		return LTAHeadless.getRebateInfo(vehicleData).then((data) => {
			rebateData = data;
			var regDate = moment(rebateData.orig_reg_date,"DD MMM YYYY");
			if (!transferDate) {
				var diff = moment(vehicleData.intended_transfer_date, 'DDMMYYYY').diff(moment(regDate), "months", true);
				
				if (diff < 3) {
					vehicleData.intended_transfer_date = moment(regDate).add("12", "months").format("DDMMYYYY");
				}
			}
			return Promise.all([
				LTAHeadless.getTransferInfoWithRetry(vehicleData, 3),
				LTAHeadless.getRoadTaxInfoWithRetry(vehicleData, 3)
			]);
			// return LTAHeadless.getTransferInfoWithRetry(vehicleData, 3)
		})
		// .then((data) => {
		// 	transferData = data;
		// 	return LTAHeadless.getRoadTaxInfoWithRetry(vehicleData, 3)
		// })
		.then((data) => {
			transferData = data[0];
			roadtaxData = data[1];
			// roadtaxData = data;
			var vehicle = parseDataV1(rebateData, transferData, roadtaxData, vehicleData);
			var vehicle = {
				...rebateData,
				...transferData,
				...roadtaxData
			}
			console.log(JSON.stringify(vehicle,null,2));
			resolve(vehicle);
		})
		.catch((error) => {
			console.log(error);
			return reject(error);
		});
	});	
}

function parseDataV1(rebateData, transferData, roadtaxData, userInputData) {
	const rebateFields = [
		{v1: "license_plate"},
		{v1: "vehicle_make"},
		{v1: "vehicle_model"},
		{v1: "primary_colour"},
		{v1: "open_market_value"},
		{v1: "orig_reg_date"},
		{v1: "first_reg_date"},
		{v1: "transfer_count"},
		{v1: "actual_arf_paid"},
		{v1: "parf_eligibility", v2: "parf_eligibility_expiry_date"},
		{v1: "coe_period"},
		{v1: "coe_rebate_amount"},
		{v1: "total_rebate_amount"},
	];
	
	const transferFields = [
		{v1: "engine_number"},
		{v1: "chassis_number"},
		{v1: "max_power_output"},
		{v1: "coe_category"},
		{v1: "coe_expiry", v2: "coe_expiry_date"},
		{v1: "coe_qp_paid"},
		{v1: "coe_pqp_paid"},
		{v1: "vehicle_type"},
		{v1: "vehicle_scheme"},
		{v1: "propellant"},
		{v1: "engine_capacity"},
		{v1: "parf_expiry", v2: "parf_eligibility_expiry_date"},
		{v1: "inspection_date", v2: "inspection_due_date"},
		{v1: "manufacturing_year"},
	];
	
	const roadTaxFields = [
		{v1: "road_tax_expiry"},
		{v1: "road_tax_nett", v2: "road_tax_amount_payable"},
	];

	var vehicle = {}
	rebateFields.forEach( (field) => {
		vehicle[field.v1] = field.v2 ? rebateData[field.v2] : rebateData[field.v1];
	});
	
	transferFields.forEach((field) => {
		vehicle[field.v1] = field.v2 ? transferData[field.v2] : transferData[field.v1];
	});

	roadTaxFields.forEach((field) => {
		vehicle[field.v1] = field.v2 ? roadtaxData[field.v2] : roadtaxData[field.v1];
	});

	if (userInputData.owner_id && userInputData.owner_id_type) {
		vehicle.owner_id = userInputData.owner_id;
		vehicle.owner_id_type = userInputData.owner_id_type;
	}

	if (userInputData.country_cd) {
		vehicle.country_cd = userInputData.country_cd;
	}

	if (userInputData.intended_transfer_date) {
		vehicle.intended_transfer_date = moment(userInputData.intended_transfer_date, "DDMMYYYY").format();
	}

	//Manual Fixes to match V1
	vehicle.engine_capacity = vehicle.engine_capacity.replace(" ", "\u00a0");
	vehicle.registration_date = moment(rebateData.orig_reg_date,"DD MMM YYYY");
	vehicle.road_tax_nett = vehicle.road_tax_nett.replace("S$", "");
	if (vehicle["coe_pqp_paid"]) {
		vehicle["coe_qp_paid"] = vehicle["coe_pqp_paid"];
		delete(vehicle["coe_pqp_paid"]);
	}

	return vehicle;
}

exports.checkIP = function(req, res) {
	LTAHeadless.getIPAddress()
	.then((value) => {
		res.send(value);
	})
	.catch((err) => {
		console.log(err);
		res.status(400).send({ error: err });
	});
}

exports.uploadHtml = function(req, res) {
	const {rebate, transfer, roadtax} = req.files;
	let rebatHtml, transferHtml, roadTaxHtml;

	if (rebate) {
		rebateHtml = rebate[0].buffer.toString();
	}

	if (transfer) {
		transferHtml = transfer[0].buffer.toString();
	}

	if (roadtax) {
		roadTaxHtml = roadtax[0].buffer.toString();
	}

	getCarFromHtml(rebateHtml, transferHtml, roadTaxHtml).then(function (car) {
		res.send(car);
	}, function(err){
		res.status(400).send({ error: err });
	});
}