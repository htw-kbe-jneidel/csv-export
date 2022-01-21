import * as rabbitMq from "./entity/rabbit-mq";

( async () => {
  const rabbitMqConnection = new rabbitMq.Connection( "127.0.0.1" );
  await rabbitMqConnection.open();
  const queue = new rabbitMq.Queue( rabbitMqConnection );
  await queue.create();

  const r = await queue.send( "initiateExport", {} );

  console.log( r );
  process.exit( 0 );
} )();
