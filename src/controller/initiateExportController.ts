import Papa from "papaparse";
import fs from "fs/promises";
import path from "path";
import * as rabbitMq from "../entity/rabbit-mq";
import { ErrorType, InitiateExportOutputType } from "../type";

export function initiateExportController( connection: rabbitMq.Connection ): Function {
  return async function initiateExportController(): Promise<InitiateExportOutputType|ErrorType> {
    try {
      const queue = new rabbitMq.Queue( connection );
      await queue.create();

      const [ products, storeLocations ]: any[] = await Promise.all( [
        queue.send( "getAllProducts", {} ),
        queue.send( "getAllStoreLocations", {} ),
      ] );

      const productVatPromises = products.map(
        p => queue.send( "caculateVat", { price: p.price, category: p.category } )
      );
      const storeDistancePromises = [
        queue.send( "calculateDistance", [ storeLocations[0].coordinates, storeLocations[1].coordinates ] ),
        queue.send( "calculateDistance", [ storeLocations[1].coordinates, storeLocations[0].coordinates ] ),
      ];

      const [
        productQuantities,
        productVatPortions,
        storeDistances,
      ]: any[
] = await Promise.all( [
  queue.send( "getAllProductQuantitiesAtLocations", {} ),
  Promise.all( productVatPromises ),
  Promise.all( storeDistancePromises ),
] );

      storeDistances[0].to = storeLocations[1].storeLocationId;
      storeDistances[1].to = storeLocations[0].storeLocationId;
      storeLocations[0].distance = storeDistances[0];
      storeLocations[1].distance = storeDistances[1];

      const storeLocationsOutput = [
        [ "id", "name", "coordinates", "distanceToWhatLocation", "walkingDistanceInMinutes", "walkingDistanceInKilometers", "osmLink" ],
        ...storeLocations.map( x => [ x.storeLocationId, x.name, x.coordinates, x.distance.to, x.distance.walkingDistanceInMinutes, x.distance.walkingDistanceInKilometers, x.distance.osmLink ] ),
      ];

      const productDictionary = {};
      products.forEach( p => productDictionary[p.productId] = p );
      for ( const [ i, product ] of products.entries() ) {
        const id = product.productId;
        const { vat } = productVatPortions[i];
        productDictionary[id].vat = vat;
      }

      const completeProducts = productQuantities.map( x => {
        const p = productDictionary[x.productId];
        return [
          x.productId,
          p.name,
          p.category,
          p.image,
          p.price,
          p.vat,
          x.storeLocationId,
          x.amount,
        ];
      } );

      const productsOutput = [
        [ "id", "name", "category", "image", "price brutto", "price netto", "location", "quantity" ],
        ...completeProducts,
      ];

      const storesLocationsCSV = Papa.unparse( storeLocationsOutput, { delimiter: "," } );
      const productsCSV = Papa.unparse( productsOutput, { delimiter: "," } );

      fs.writeFile( path.resolve( __dirname, "../..", "store-locations.csv" ), storesLocationsCSV );
      fs.writeFile( path.resolve( __dirname, "../..", "products.csv" ), productsCSV );
    } catch ( err: any ) {
      console.log( err );
      return {
        error   : true,
        errorMsg: err.message,
      };
    }

    return { error: false };
  };
}
