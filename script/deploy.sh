#!/usr/bin/env bash
echo "> TEX deploy"
# 제가 본 예제에서는 S3에서 EC2로 파일을 받는 폴더를 별도로 지정한 후에 복사하여 원하는 경로에 파일을 이동하는 작업을 진행한 것 같습니다.
# 해당 코드 출처: # <https://www.sunny-son.space/AWS/Github%20Action%20CICD/>
# 어떤 작업을 진행하는 지는 본인이 지정하면 될 것 같습니다.
# 저는 별도의 작업을 진행하지 않았습니다. 
sudo cp -rf /home/ubuntu/deploy-fe/dist/* /var/www/html