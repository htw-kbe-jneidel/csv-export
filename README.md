# csv-export

Export the business data as CSV. Available through message queue RPC calls.

## Queues

### initiateCsvExport

Start an export of all data in the system and save it locally as a CSV.

Input: none

Reponse sucess:
```
{
  error:boolean,
}
```

Reponse error:
```
{
  error:boolean,
  errorMsg:string
}
```
