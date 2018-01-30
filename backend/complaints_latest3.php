<?php

header(
  'Content-Type: application/json;charset=utf8'
);
header(
  'Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Origin, Authorization'
);
header(
  'Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS'
);
header(
  'Access-Control-Allow-Origin: *'
);

?>
DateRecv,Project,ItemCode,Complaint Category 1,Complaint Category 2,Complaint Category 3,Quantity,Affected
2017/01/01,zone1,prod1,A,,B,1000,500
2017/01/01,zone1,prod3,A,B,B,200,100
2017/01/01,zone2,prod5,C,,400,150
2017/01/01,zone2,prod7,A,B,C,2000,1800