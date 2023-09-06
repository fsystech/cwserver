rem loadtest -t 20 -c 10 --rps 200 http://localhost:8080/
rem loadtest -c 10 --rps 500 http://localhost:8080/
rem loadtest http://localhost:8080/ -t 20 -c 10 --rps 1000
rem loadtest http://localhost:8080/test-load -t 20 -c 50 --rps 1000
rem loadtest https://cwserver.fsys.tech/readme -t 20 -c 50 --rps 1000
rem loadtest https://www.google.com/ -t 20 -c 50 --rps 1000

bombardier http://localhost:3000/test with 5000000 requests using 125 connections
bombardier -c 125 -n 10000000 http://localhost:8080/

bombardier -c 125 -n 100000 http://localhost:8080/

bombardier -c 125 -n 5000000 http://localhost:8080/

bombardier -c 1500 -n 20000 http://localhost:8080/test