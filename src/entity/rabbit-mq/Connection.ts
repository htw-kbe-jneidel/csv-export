import amqp from "amqplib";

export class Connection {
  private ip: String;
  // private port:number;
  private _connection: any = undefined;

  constructor( ip: String ) {
    this.ip = ip;
    /* , port:number
    this.port = port; */
  }

  get connection() {
    if ( this._connection === undefined )
      throw new Error( "RabbitMqConnection.open has not been called" );

    return this._connection;
  }

  async open() {
    this._connection = await amqp.connect( `amqp://${this.ip}` );
  }

  async createChannel() {
    return this.connection.createChannel();
  }
}
