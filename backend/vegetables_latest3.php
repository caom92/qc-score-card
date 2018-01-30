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
TSDone,ItemCode,Project,Itemcount,Discoloration,InsectPresenceFrass,Softness,Bruising,Decay,DehydrationShrivel,AbnormalSoftness,UnhealedCutsSplits,Undersized,Oversized,InsectDamage,Scarring
2017/01/01,PROD1,ZONE1,250,25,50,30,20,10,5,20,40,5,10,20,15
2017/01/01,PROD2,ZONE1,150,20,0,30,50,15,15,10,10,0,0,0,0
2017/01/01,PROD3,ZONE2,200,25,25,0,0,10,10,15,15,0,0,0,100
2017/01/01,PROD4,ZONE2,400,0,0,0,0,0,0,0,0,0,0,0,0