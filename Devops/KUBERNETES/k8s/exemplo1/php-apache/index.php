<?php

$x = 0.0001;
for ($i=0; $i <= 10000000 ; $i++) { 
    $x += sqrt($x);
}

echo "Chico Wall teste Autoscaler";