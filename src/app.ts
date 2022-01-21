import * as rabbitMq from "./entity/rabbit-mq";
import { initiateExportController } from "./controller";

const RABBIT_MQ_IP =  "127.0.0.1" ;
const EXPORT_QUEUE = "initiateCsvExport";

( async () => {
  const rabbitMqConnection = new rabbitMq.Connection( RABBIT_MQ_IP );
  await rabbitMqConnection.open();

  const queue = new rabbitMq.Queue( rabbitMqConnection );
  await queue.create();

  queue.setController( initiateExportController( rabbitMqConnection ) );
  queue.listen( EXPORT_QUEUE );
} )();
