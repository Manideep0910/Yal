/*
SPDX-License-Identifier: Apache-2.0
*/
'use strict';

// Fabric smart contract classes
const {
    Contract,
    Context
} = require('fabric-contract-api');




class YaliyomoContract extends Contract {

    /*
    initi ledger is called during chaincoe installation
    */

    async initLedger(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
        await ctx.stub.putState('test_key', 'newState');
    }

    /*
    a dummy method to query and confirm chaincode isntallation
    */

    async testquery(ctx) {
        const testVal = await ctx.stub.getState('test_key'); // get the car from chaincode state
        if (!testVal || testVal.length === 0) {
            throw new Error(`does not exist`);
        }
        console.log(testVal.toString());
        return testVal.toString();
    }

    /*********************************************************************************************** */
    /*
        Method : productRelation
        Creating relation between parent and child
        validation: checks if the issuer is of type brandowner
    */
    async productRelation(ctx, obj) {
        let tmp = JSON.parse(obj)
        //obj contains issuerid, parentID, productUuid, txDate
        let response = {}
        let user = await ctx.stub.getState(tmp.issuerUuid)
        if (!user || user.length === 0) {
            throw new Error(JSON.stringify({ code: "IP01", data: tmp.issuerUuid }));
        }
        user = JSON.parse(user.toString())
        // if (user.userType !== "brandowner") {
        //     //"Only a brandowner can edit a product"
        //     throw new Error(JSON.stringify({code:"PR01",data:tmp.issuerId}));
        // }
        let product = await ctx.stub.getState(tmp.productUuid)
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "RR01", data: tmp.productUuid }));
        }
        product = JSON.parse(product.toString())
        product["parentID"] = tmp.parentID
        product["txDate"] = tmp.txDate;
        await ctx.stub.putState(tmp.productUuid, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        return response;
    }

    async productnodes(ctx, productID) {
        console.log("inputs", productID)
        let temp = await this.recursiveFcn(ctx, productID)
        console.log("output", temp)
        return temp
    }
    async recursiveFcn(ctx, productID) {
        //obj contains productID
        //let response = {partObj:{},partComposition:[]}
        let product = await this.getChildObj(ctx, productID)
        product.partComposition = []
        //product = JSON.parse(product.toString())
        //response.partObj=product.partObj
        if (product.partCompositionArray.length <= 0) {
            console.log("product", product)
            return product
        } else {
            for (let i = 0; i < product.partCompositionArray.length; i++) {
                console.log("inside for loop array", product.partCompositionArray)
                let temp = await this.productnodes(ctx, product.partCompositionArray[i])
                //
                console.log("product", JSON.stringify(product))
                console.log("temp", JSON.stringify(temp))
                // var count = 0;

                temp.partObj.percentageUsed = product.partObj.partComposition[i].percentageUsed

                product.partComposition.push(temp)

            }
            delete product.partCompositionArray
            return product
        }
    }
    async getChildObj(ctx, id) {
        let temp = await ctx.stub.getState(id)
        if (!temp || temp.length === 0) {
            throw new Error(JSON.stringify({ code: "RF01", data: id }));
        }
        temp = JSON.parse(temp.toString());
        let partCompositionArray = []
        for (let i = 0; i < temp.partComposition.length; i++) {

            partCompositionArray.push(temp.partComposition[i].partID)
        }
        return { partObj: temp, partCompositionArray: partCompositionArray }
    }
    async productConsumers(ctx, obj) {
        let tmp = JSON.parse(obj)
        let queryString = {};
        queryString.selector = { "productAttributes": { "Name": { "$eq": tmp.product } }, "mfd": { "$eq": tmp.companyId }, "$not": { "owner": tmp.companyId }, isDeleted : { "$or": [
            {
                "$ne": ""
            },
            {
                    "$exists": false
            }
        ]}};
        queryString = JSON.stringify(queryString)

        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let results = await this.getAllResults(resultsIterator, false);


        var productList = JSON.stringify(results)

        if (productList == "[]" || productList == [] || results == null) {
            return []
        } else {
            productList = JSON.parse(productList)
        }
        let consumerList = [];

        for (let i = 0; i < productList.length; i++) {
            var item = productList[i]
            if (item.Record.ret && item.Record.ret != "") {
                if (item.Record.owner === item.Record.ret) {
                    console.log("owner is retailer, pushing", item.Record.owner)
                    var user = await ctx.stub.getState(item.Record.owner);
                    user = JSON.parse(user.toString())
                    consumerList.push(user)
                }
                else {
                    console.log("owner is not retailer, pushing", item.Record.owner)
                    var user = await ctx.stub.getState(item.Record.owner);
                    user = JSON.parse(user.toString())
                    consumerList.push(user)
                    //retailer
                    if (item.Record.ret && item.Record.ret != "") {
                        var ret = await ctx.stub.getState(item.Record.ret);
                        ret = JSON.parse(ret.toString())
                        consumerList.push(ret)
                    }
                }
            } else {
                console.log("No retailer, pushing", item.Record.owner)
                var user = await ctx.stub.getState(item.Record.owner);
                user = JSON.parse(user.toString())
                consumerList.push(user)
            }

        }

        return consumerList;
    }

    /*
        Registers a new company
    */
    async registerCompany(ctx, company, uuid, txDate) {

        // registers a company
        let response = {}
        company = JSON.parse(company)
        company["txDate"] = txDate
        company.blockchainID = uuid;
        company.entityType = "company"
        await ctx.stub.putState(uuid, Buffer.from(JSON.stringify(company)));
        let transactionID = ctx.stub.getTxID();
        response.data = company;
        response.transactionId = transactionID
        //await ctx.stub.InvokeChaincode('qscc', )
        return response;

    }

    

    /*
       Registers a new user
       userType could be either retailer/brandowner/consumer
       if the registration is for brandowner or retailer, the company should be existing already
   */
    async registerUser(ctx, userobjstr, uuid, txDate) {
        //registers a user - brandowner/retailer/consumer
        let response = {}
        let user = JSON.parse(userobjstr)
        user.entityType = "user"
        user.blockchainID = uuid
        user["txDate"] = txDate;
        if (user.company) {
            let companyID = user.company
            let company = await ctx.stub.getState(uuid, Buffer.from(JSON.stringify(companyID)));
            console.log(company, !company)
            if (!company) {
                throw new Error("this company does not exists");
            }
        } else {
            user.company = uuid
        }
        await ctx.stub.putState(uuid, Buffer.from(JSON.stringify(user)));
        let transactionID = ctx.stub.getTxID();
        response.data = user;
        response.transactionId = transactionID
        //await ctx.stub.InvokeChaincode('qscc', )
        return response;

    }

    /*
        Method : issueProduct
        Creating a new product
        new Product will have a ownership of the company
        validation: checks if the issuer is of type brandowner
    */
    async issueMultiProducts(ctx, issuerid, productObj, source, txDate) {
        let response = {}
        const products = JSON.parse(productObj)
        const productIDS = products.uuid
        let user = await ctx.stub.getState(issuerid)
        if (!user || user.length === 0) {
            throw new Error(JSON.stringify({ code: "IP01", data: issuerid }));
        }
        user = JSON.parse(user.toString())
        for (let i = 0; i < productIDS.length; i++) {
            const product = Object.create(products)
            product.uuid = products.uuid[i]
            if (!product.uuid[i]) {
                throw new Error(JSON.stringify({ code: "IP01", data: issuerid }));
            }
            product.isParent = true;
            product.percentageUsed = 0;
            product.parentID = [];
            product.partComposition = [];
            product.owner = user.company;
            product.mfd = user.company
            product.entityType = "product"
            product.blockchainID = product.uuid
            product.productAttributes = products.productAttributes
            product.productClass = products.productClass
            product["txDate"] = txDate;
            product['source'] = source;
            product.action = "Initial stage"
            let productBytes = Buffer.from(JSON.stringify(product))
            await ctx.stub.putState(product.uuid, productBytes);
        }
        response.data = productIDS;
        response.transactionId = ctx.stub.getTxID()
        return response;
    }
    async upload(ctx, issuerid, productStr, uuid, txDate) {
        let response = {}
        let user = await ctx.stub.getState(issuerid)

        if (!user || user.length === 0) {
            throw new Error(JSON.stringify({ code: "IP01", data: issuerid }));
        }
        let savedProductBytes = await ctx.stub.getState(uuid)
        if (!savedProductBytes || savedProductBytes.length === 0) {
            throw new Error(JSON.stringify({ code: "IP01", data: uuid }));
        }
        let savedProduct = JSON.parse(savedProductBytes.toString());
        let product = JSON.parse(productStr)
        product.action = "uploaded document successfully"
        product.isParent = savedProduct.isParent
        product.percentageUsed = savedProduct.percentageUsed
        product.parentID = savedProduct.parentID
        product.partComposition = savedProduct.partComposition
        if (savedProduct.usedIn) {
            product.usedIn = savedProduct.usedIn
        }
        product.owner = savedProduct.owner
        product.mfd = savedProduct.mfd
        product.entityType = savedProduct.entityType
        product.blockchainID = savedProduct.blockchainID
        product.source = savedProduct.source
        product["txDate"] = txDate;
        await ctx.stub.putState(uuid, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        return response;
    }
    async updateProduct(ctx, issuerid, productStr, uuid, txDate) {
        let response = {}
        let user = await ctx.stub.getState(issuerid)

        if (!user || user.length === 0) {
            throw new Error(JSON.stringify({ code: "IP01", data: issuerid }));
        }
        let savedProductBytes = await ctx.stub.getState(uuid)
        if (!savedProductBytes || savedProductBytes.length === 0) {
            throw new Error(JSON.stringify({ code: "IP01", data: uuid }));
        }
        let savedProduct = JSON.parse(savedProductBytes.toString());
        let product = JSON.parse(productStr)
        product.action = "update Product Attributes"
        product.isParent = savedProduct.isParent
        product.percentageUsed = savedProduct.percentageUsed
        product.parentID = savedProduct.parentID
        product.partComposition = savedProduct.partComposition
        if (savedProduct.usedIn) {
            product.usedIn = savedProduct.usedIn
        }
        product.owner = savedProduct.owner
        product.mfd = savedProduct.mfd
        product.entityType = savedProduct.entityType
        product.blockchainID = savedProduct.blockchainID
        product.source = savedProduct.source
        product["txDate"] = txDate;
        await ctx.stub.putState(uuid, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        return response;
    }
    async issueProduct(ctx, issuerid, productStr, uuid, txDate) {

        let response = {}
        let product = JSON.parse(productStr)

        let user = await ctx.stub.getState(issuerid)

        if (!user || user.length === 0) {
            throw new Error(JSON.stringify({ code: "IP01", data: issuerid }));
        }

        user = JSON.parse(user.toString())

        product.isParent = true;
        product.percentageUsed = 0;
        product.parentID = [];
        product.partComposition = [];
        product.owner = user.company;
        product.mfd = user.company
        product.entityType = "product"
        product.blockchainID = uuid
        product["txDate"] = txDate;
        product.action = "Initial stage"

        await ctx.stub.putState(uuid, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        //await ctx.stub.InvokeChaincode('qscc', )
        return response;

    }

    /*
        Method : assignToretailer
       1. Only a brandOwner can assign a product 
       2. Brandowner should be the current owner of the product
       3. set an attribute 'assignedTo" to the retailer company ID"
    */
    async assignToRetailer(ctx, issuerUuid, productId, retailerCompanyid, userID, txDate) {
        let retailerCompany = await ctx.stub.getState(retailerCompanyid);

        if (!retailerCompany) {
            throw new Error(JSON.stringify({ code: "AR01", data: retailerCompanyid }));
        }

        let issuer = await ctx.stub.getState(issuerUuid);
        if (!issuer) {
            throw new Error(JSON.stringify({ code: "AR02", data: issuerUuid }));
        }

        issuer = JSON.parse(issuer.toString())


        retailerCompany = JSON.parse(retailerCompany.toString())


        let product = await ctx.stub.getState(productId);
        if (!product) {
            throw new Error(JSON.stringify({ code: "RR01", data: productId }));
        }
        product = JSON.parse(product.toString())
        if (product.owner !== issuer.company) {
            throw new Error(JSON.stringify({ code: "AR04", data: issuer.company }));
        }

        product.action = "Brandowner assigned product to retailer " + retailerCompanyid;
        if (userID != '') {
            product.userID = userID
        }
        product.assignedTo = retailerCompanyid
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();

        let response = {};
        response.data = product;
        response.transactionId = transactionID
        //await ctx.stub.InvokeChaincode('qscc', )
        return response;

    }

    /*
        Method : retailerResponse
      1.checck if the product is actually assiged to the retailer
      2. make the 
    */
    async retailerResponse(ctx, productId, retailerId, responseString, txDate) {

        responseString = (responseString === 'true');

        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "RR01", data: productId }));
        }

        product = JSON.parse(product.toString());

        let retailer = await ctx.stub.getState(retailerId);
        if (!retailer || retailer.length === 0) {
            throw new Error(JSON.stringify({ code: "AR01", data: retailerId }));
        }
        retailer = JSON.parse(retailer.toString());

        if (retailer.company !== product.assignedTo) {
            throw new Error(JSON.stringify({ code: "RR02", data: assignedTo }));
        }

        if (responseString) {
            product.owner = product.assignedTo
            product.action = "retailer accepted the assignment"
            product.ret = product.assignedTo;
            delete product.assignedTo;
        } else {
            delete product.assignedTo;
            product.action = "retailer rejected the assignment"
        }
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        let response = {}
        response.data = product;
        response.transactionId = transactionID
        //await ctx.stub.InvokeChaincode('qscc', )
        return response;
    }

    async cancelAssignment(ctx, productId, txDate) {

        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "CA01", data: productId }));
        }

        product = JSON.parse(product.toString())
        delete product.assignedTo;
        product.txDate = txDate;
        product.action = "  cancelled assignment by brandowner ";
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        let response = {}
        response.data = product;
        response.transactionId = transactionID
        //await ctx.stub.InvokeChaincode('qscc', )
        return response;

    }
    async autoTransferOwnership(ctx, ownerUuid, newOwnerId, productId, transferType, txDate, price, currency) {
        let response = {}
        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "CO01", data: productId }));
        }

        product = JSON.parse(product.toString())
        if (product.partialOwnership) {
            for (let i = 0; i < product.partialOwnership.length; i++) {
                if (ownerUuid == product.partialOwnership[i].owner) {
                    product.partialOwnership[i].owner = newOwnerId
                }
            }
        }
        let ownershipString = newOwnerId;
        product.ret = product.owner
        if (price !== 0) {
            product.price = price;
        }
        product.owner = ownershipString;
        product.txDate = txDate;
        product.transferType = transferType;
        product.currency = currency;
        product.action = "Auto Transfer to partner " + ownershipString
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        return response;
    }
    async claimOwnership(ctx, issuerId, productId, price, txDate, currency) {

        let response = {}
        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "CO01", data: productId }));
        }

        product = JSON.parse(product.toString())
        console.log(product)
        product.claimedBy = issuerId;
        product.txDate = txDate;
        product.currency = currency;
        if (price != "") {
            product.claimAmount = price
        }
        product.action = "ownership claimed by " + issuerId
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        return response;
    }

    async rejectClaim(ctx, issuerId, productId, txDate) {

        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "RC01", data: productId }));
        }

        product = JSON.parse(product.toString())
        delete product.claimedBy;
        delete product.claimAmount;
        product.txDate = txDate;
        product.action = "rejected claim by retailer " + issuerId;
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        let response = {}
        response.data = product;
        response.transactionId = transactionID
        //await ctx.stub.InvokeChaincode('qscc', )
        return response;

    }

    async cancelClaim(ctx, issuerId, productId, txDate) {

        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "CC01", data: productId }));
        }

        product = JSON.parse(product.toString())
        if (product.claimedBy == issuerId) {
            delete product.claimedBy;
            delete product.claimAmount;
        } else {
            throw new Error(JSON.stringify({ code: "CC02", data: issuerId }));
        }

        product.txDate = txDate;
        product.action = "consumer canlcelled claim" + issuerId;
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let transactionID = ctx.stub.getTxID();
        let response = {}
        response.data = product;
        response.transactionId = transactionID
        //await ctx.stub.InvokeChaincode('qscc', )
        return response;

    }
    //issuerUuid, productUuid, status,org, txDate
    async updateStatus(ctx, issuerId, productId, status, txDate, claimedBy ) {
        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "TO01", data: productId }));
        }
        product = JSON.parse(product.toString())
        console.log("updating " + status)
        product.txDate = txDate;
        product.claimedBy = claimedBy;
        product.action = status
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let response = {}
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        return response;
    }
    async transferOwnerShip(ctx, issuerId, ownerUuid, productId, newOwnerId, transferType, txDate, currency, custom) {

        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "TO01", data: productId }));
        }

        product = JSON.parse(product.toString())
        if (product.partialOwnership) {
            for (let i = 0; i < product.partialOwnership.length; i++) {
                if (ownerUuid == product.partialOwnership[i].owner) {
                    product.partialOwnership[i].owner = newOwnerId
                }
            }
        }
        let ownershipString = newOwnerId;

        console.log("product", product)
        product.ret = product.owner
        product.price = product.claimAmount;
        product.owner = ownershipString;
        if (transferType && transferType != "") {
            product.transferType = transferType;
        }
        product.txDate = txDate;
        product.currency = currency;
        product.custom=JSON.parse(custom);
        product.action = "Ownership transferred to partner " + ownershipString
        delete product.claimedBy;

        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));
        let response = {}
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID

        return response;

    }


    async reportStolen(ctx, productId, txDate) {

        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "RS01", data: productId }));
        }

        product = JSON.parse(product.toString())
        product.isStolen = true;
        product.action = "Marked Stolen"
        product.txDate = txDate;
        delete product.claimedBy;
        delete product.claimAmount;
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

        let response = {}
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        return response;

    }

    async reportFound(ctx, productId, txDate) {

        let product = await ctx.stub.getState(productId);
        if (!product || product.length === 0) {
            throw new Error(JSON.stringify({ code: "RF01", data: productId }));
        }

        product = JSON.parse(product.toString())
        delete product.isStolen;
        product.action = "Marked found"
        product.txDate = txDate;
        await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

        let response = {}
        let transactionID = ctx.stub.getTxID();
        response.data = product;
        response.transactionId = transactionID
        return response;

    }
    // associate to existing product
    //inputs {productID,parentID,percentageUsed}
    async updatePart(ctx, productString, txDate) {
        let product = JSON.parse(productString)
        if (product.percentageUsed > 100 || product.percentageUsed < 0) {
            throw new Error(JSON.stringify({ code: "UP01", data: product.productID }));
        }
        let subPartObj = await ctx.stub.getState(product.productID);
        let subPart = JSON.parse(subPartObj)
        let parentPartObj = await ctx.stub.getState(product.parentID);
        let parentPart = JSON.parse(parentPartObj)
        let issuerObj = await ctx.stub.getState(product.issuer);
        let issuer = JSON.parse(issuerObj)
        if (issuer.company != parentPart.owner) {
            throw new Error(JSON.stringify({ code: "1001", data: product.issuer }));
        }

        if (parentPart.parentID.includes(product.productID) || product.productID == product.parentID) {
            throw new Error(JSON.stringify({ code: "UP02", data: product.productID }));
        }
        if (subPart.owner != product.companyID || parentPart.owner != product.companyID || issuer.company != parentPart.owner) {
            throw new Error(JSON.stringify({ code: "UP04", data: product.productID }));
        }
        parentPart.partComposition.push({ partID: product.productID, percentageUsed: product.percentageUsed })
        subPart.parentID.push(product.parentID)
        subPart.percentageUsed = subPart.percentageUsed + product.percentageUsed
        if (!subPart.usedIn) {
            subPart.usedIn = []
        }

        if (subPart.percentageUsed > 100) {
            throw new Error(JSON.stringify({ code: "UP01", data: product.productID }));
        }
        subPart.isParent = false
        subPart.usedIn.push({ partID: product.parentID, percentageUsed: product.percentageUsed })
        parentPart.isParent = true
        parentPart.action = "added a new subPart " + product.productID
        subPart.action = "added as a subPart to " + product.parentID

        subPart["txDate"] = txDate
        parentPart["txDate"] = txDate
        console.log("subPart: " + subPart)
        console.log("parentPart: " + parentPart)
        await ctx.stub.putState(product.productID, Buffer.from(JSON.stringify(subPart)));
        await ctx.stub.putState(product.parentID, Buffer.from(JSON.stringify(parentPart)));
        return subPart;
    }
    async deletePart(ctx, productString, txDate) {
        let product = JSON.parse(productString)
        let subPartObj = await ctx.stub.getState(product.productID);
        let subPart = JSON.parse(subPartObj)
        let parentPartObj = await ctx.stub.getState(product.parentID);
        let parentPart = JSON.parse(parentPartObj)
        if (!subPart.parentID.includes(product.parentID)) {
            throw new Error(JSON.stringify({ code: "UP03", data: product.productID }));
        }
        if (subPart.owner != product.companyID || parentPart.owner != product.companyID) {
            throw new Error(JSON.stringify({ code: "UP04", data: product.productID }));
        }
        let flag1 = false;
        for (let part = 0; part < parentPart.partComposition.length; part++) {
            if (parentPart.partComposition[part].partID == product.productID && parentPart.partComposition[part].percentageUsed == product.percentageUsed) {
                parentPart.partComposition.splice(part, 1);
                flag1 = true;
            }
        }
        if (!flag1) {
            throw new Error(JSON.stringify({ code: "UP04", data: product.productID }));
        }

        for (let i = 0; i < subPart.usedIn.length; i++) {
            if (subPart.usedIn[i].partID == product.parentID && subPart.usedIn[i].percentageUsed == product.percentageUsed) {
                console.log("subPart Percentage", subPart.percentageUsed)
                subPart.usedIn.splice(i, 1)
                let index = subPart.parentID.findIndex(element => element === product.parentID)
                subPart.parentID.splice(index, 1)
            }
        }
        let flag3 = 0;
        if (subPart.owner != parentPart.owner) {
            if (subPart.partialOwnership) {
                for (let l = 0; l < subPart.partialOwnership.length; l++) {
                    if (subPart.partialOwnership[l].owner == parentPart.owner) {
                        subPart.partialOwnership[l].percentage = subPart.partialOwnership[l].percentage + product.percentageUsed
                        flag3 = 1;
                    }
                }
                if (flag3 = 0) {
                    subPart.partialOwnership.push({ "owner": parentPart.owner, "percentage": product.percentageUsed })
                }
            } else {
                subPart.partialOwnership = [{ "owner": parentPart.owner, "percentage": product.percentageUsed }]
            }
        }
        subPart.percentageUsed = subPart.percentageUsed - product.percentageUsed
        subPart.isParent = true
        parentPart.isParent = true
        parentPart.action = "removed a subPart " + product.productID
        subPart.action = "removed association with " + product.parentID

        subPart["txDate"] = txDate
        parentPart["txDate"] = txDate
        console.log("subPart: " + subPart)
        console.log("parentPart: " + parentPart)
        await ctx.stub.putState(product.productID, Buffer.from(JSON.stringify(subPart)));
        await ctx.stub.putState(product.parentID, Buffer.from(JSON.stringify(parentPart)));
        return subPart;
    }

    async removeSubPart(ctx, productID, parentID, parentPart, txDate) {
        let subPartObj = await ctx.stub.getState(productID);
        let subPart = JSON.parse(subPartObj)

        if (!subPart.parentID.includes(parentID)) {
            throw new Error(JSON.stringify({ code: "UP03", data: productID }));
        }
        let flag1 = false;
        for (let part = 0; part < parentPart.partComposition.length; part++) {
            console.log("partID,productID,percentageUsed,percentageSupartUsed",parentPart.partComposition[part].partID,subPart.blockchainID,parentPart.partComposition[part].percentageUsed,subPart.percentageUsed)
            if (parentPart.partComposition[part].partID == subPart.blockchainID && parentPart.partComposition[part].percentageUsed == subPart.percentageUsed) {
                parentPart.partComposition.splice(part, 1);
                flag1 = true;
                console.log("Flag 1",flag1)
            }
        }
        if (!flag1) {
            throw new Error(JSON.stringify({ code: "UP04", data: productID }));
        }

        for (let i = 0; i < subPart.usedIn.length; i++) {
            if (subPart.usedIn[i].partID == parentID && subPart.usedIn[i].percentageUsed == subPart.percentageUsed) {
                console.log("subPart Percentage", subPart.percentageUsed)
                subPart.usedIn.splice(i, 1)
                let index = subPart.parentID.findIndex(element => element === parentID)
                subPart.parentID.splice(index, 1)
            }
        }
        // let flag3 = 0;
        // if (subPart.owner != parentPart.owner) {
        //     if (subPart.partialOwnership) {
        //         for (let l = 0; l < subPart.partialOwnership.length; l++) {
        //             if (subPart.partialOwnership[l].owner == parentPart.owner) {
        //                 subPart.partialOwnership[l].percentage = subPart.partialOwnership[l].percentage + product.percentageUsed
        //                 flag3 = 1;
        //             }
        //         }
        //         if (flag3 = 0) {
        //             subPart.partialOwnership.push({ "owner": parentPart.owner, "percentage": product.percentageUsed })
        //         }
        //     } else {
        //         subPart.partialOwnership = [{ "owner": parentPart.owner, "percentage": product.percentageUsed }]
        //     }
        // }
        subPart.percentageUsed = subPart.percentageUsed - parentPart.percentageUsed
        subPart.isParent = true
        parentPart.isParent = true
        parentPart.action = "part deleted successfully" + productID
        subPart.action = "removed association with " + parentID

        subPart["txDate"] = txDate
        parentPart["txDate"] = txDate
        console.log("subPart: " + subPart)
        console.log("parentPart: " + parentPart)
        await ctx.stub.putState(productID, Buffer.from(JSON.stringify(subPart)));
        return parentPart;
    }
    async deleteProduct(ctx, productID, removeSubParts, txDate) {

        let PartObj = await ctx.stub.getState(productID);
        let Part = JSON.parse(PartObj)
        console.log('Performing delete on: ',Part, ' removeSubParts= ', removeSubParts)
        if (Part.owner === Part.mfd) {
            Part.isDeleted = true;
        if(removeSubParts === true || removeSubParts === "true"){
                for (let i = 0; i < Part.partComposition.length; i++) {
                    console.log('Performing delete on subPart: ',Part.partComposition[i].partID)
                    let sPartObj = await ctx.stub.getState(Part.partComposition[i].partID);
                    let sPart = JSON.parse(sPartObj)
                    sPart.isDeleted = true;
                    sPart.txDate = txDate;
                    await ctx.stub.putState(Part.partComposition[i].partID, Buffer.from(JSON.stringify(sPart)));
                }
            console.log('Part deleted: ',Part)
            Part.isDeleted=true;
            Part.txDate = txDate;
            Part.action = "part deleted successfully"
            await ctx.stub.putState(productID, Buffer.from(JSON.stringify(Part)));
            }else{
                for (let i = 0; i < Part.partComposition.length; i++) {
                    console.log('remove all subparts')
                    Part = await this.removeSubPart(ctx, Part.partComposition[i].partID, productID, Part, txDate)
                }
            console.log('Part deleted: ',Part)
            await ctx.stub.putState(productID, Buffer.from(JSON.stringify(Part)));
            }
        } else {
            throw new Error(JSON.stringify({ code: "UP03", data: productID }));
        }
        // update parentID
        return Part;
    }

    // query current state and sets new value for the existing state
    async updateState(stub, key, attribute, newValue, action, txDate) {
        console.log("updating " + attribute + " with " + newValue)
        let stateObj = await stub.getState(key);
        stateObj = JSON.parse(stateObj.toString())
        if (newValue == null) {
            delete product[attribute]
        }
        stateObj[attribute] = newValue;
        stateObj["action"] = action;
        stateObj["txDate"] = txDate
        await stub.putState(key, Buffer.from(JSON.stringify(stateObj)));
        return stateObj;
    }

    // creates new Data
    async uploadFile(ctx, key, data) {
        data = JSON.parse(data)
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(data)));
        return data;
    }
    async downloadFile(ctx, key) {
        let data = await ctx.stub.getState(key);
        data = JSON.parse(data.toString())
        return data;
    }

    /********************************************************************** */


    async queryallKeys(ctx, productID) {

        let data = await ctx.stub.getState(productID)
        return JSON.parse(data.toString())

    }

    async queryDataById(ctx, productID) {

        let data = await ctx.stub.getState(productID)
        return JSON.parse(data.toString())

    }


    async getHistory(ctx, identifier) {

        let iterator = await ctx.stub.getHistoryForKey(identifier)
        let history = await this.getAllResults(iterator, true);
        return history;

    }

    async queryBrandConsumers(ctx, companyId) {
        let queryString = { selector: { "mfd": { "$eq": companyId }, "$not": { "owner": companyId }, isDeleted : { "$or": [
            {
                "$ne": ""
            },
            {
                    "$exists": false
            }
        ]} } }
        queryString = JSON.stringify(queryString)
        // get all product details for mfd 
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
        let productList = await this.getAllResults(resultsIterator, false);
        // 
        let consumerList = [];
        for (let i = 0; i < productList.length; i++) {
            var item = productList[i]
            if (item.Record.ret && item.Record.ret != "") {
                if (item.Record.owner === item.Record.ret) {
                    console.log("owner is retailer, pushing", item.Record.owner)
                    let userObj = await ctx.stub.getState(item.Record.owner)
                    let user = JSON.parse(userObj);

                    user.productID = item.Record.blockchainID
                    item.Record.productClass ? user.productClass = item.Record.productClass : null
                    consumerList.push(user);
                    console.log("owner is retailer, pushing", item.Record.owner)

                    userObj = await ctx.stub.getState(item.Record.mfd);
                    user = JSON.parse(userObj);

                    user.productID = item.Record.blockchainID
                    item.Record.productClass ? user.productClass = item.Record.productClass : null
                    consumerList.push(user);
                    console.log(user);
                }
                else {
                    console.log("owner is retailer, pushing", item.Record.owner)
                    let userObj = await ctx.stub.getState(item.Record.owner);
                    let user = JSON.parse(userObj);
                    user.productID = item.Record.blockchainID
                    item.Record.productClass ? user.productClass = item.Record.productClass : null
                    consumerList.push(user);

                    //consumerUuidList.push(item.Record.ret)
                    console.log("owner is retailer, pushing", item.Record.owner)
                    userObj = await ctx.stub.getState(item.Record.ret);
                    user = JSON.parse(userObj);
                    user.productID = item.Record.blockchainID
                    item.Record.productClass ? user.productClass = item.Record.productClass : null
                    consumerList.push(user);
                    console.log(user);
                }
            } else {
                console.log("owner is retailer, pushing", item.Record.owner)
                let userObj = await ctx.stub.getState(item.Record.owner);
                let user = JSON.parse(userObj);

                user.productID = item.Record.blockchainID
                item.Record.productClass ? user.productClass = item.Record.productClass : null
                consumerList.push(user);
                console.log(user);
            }
        }
        return consumerList;
    }
    async queryByQueryString(ctx, query) {


        let queryString = {};
        queryString.selector = JSON.parse(query);
        queryString.selector.isDeleted = { "$or": [
            {
                "$ne": ""
            },
            {
                    "$exists": false
            }
        ]}

        queryString = JSON.stringify(queryString)

        console.log("final query string", queryString)
        let resultsIterator = await ctx.stub.getQueryResult(queryString);

        let results = await this.getAllResults(resultsIterator, false);

        return results;
    }
    async queryWithPagination(ctx, query, pageSize, offset) {

        let queryString = {};
        queryString.selector = JSON.parse(query);
        queryString.selector.isDeleted = { "$or": [
            {
                "$ne": ""
            },
            {
                    "$exists": false
            }
        ]}
        queryString.sort = [
            {
                "txDate": "desc"
            }
        ]
        queryString = JSON.stringify(queryString)

        console.log("final query string", queryString)
        let resultsIterator = await ctx.stub.getQueryResultWithPagination(queryString, parseInt(pageSize, 10), offset);
        const { iterator, metadata } = resultsIterator;
        let results = await this.getAllResults(iterator, false);

        return { results: results, metadata: metadata };
    }

    async getAllResults(iterator, isHistory) {
        let allResults = [];
        while (true) {
            let res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                console.log(res.value.toString('utf8'));
                console.log(res.value.value.toString('utf8'));

                if (isHistory && isHistory === true) {
                    jsonRes.TxId = res.value.txId;
                    jsonRes.Timestamp = res.value.timestamp;
                    console.log(jsonRes.TxId);
                    if (res.value.is_delete !== undefined)
                        jsonRes.IsDelete = res.value.is_delete.toString();
                    try {
                        jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Value = res.value.value.toString('utf8');
                    }
                } else {
                    jsonRes.Key = res.value.key;
                    try {
                        jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
                    } catch (err) {
                        console.log(err);
                        jsonRes.Record = res.value.value.toString('utf8');
                    }
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return allResults;
            }
        }
    }

    async callExternalChaincode(ctx) {
        let response = await ctx.stub.invokeChaincode('qscc', ["GetBlockByNumber", "mycc", "1"])

    }


}

module.exports = YaliyomoContract;