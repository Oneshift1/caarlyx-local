### Installing
```
npm i
```
### Running
```
node index.js
```
### API Call
```
curl --location 'http://localhost:3000/solve' \
--header 'Content-Type: application/json' \
--data '{
    "license_plate": "SMA2423R",
    "owner_id": "955A",
    "owner_id_type": "1",
    "intended_transfer_date": "27112024"
}'
```
