#!/usr/bin/python3
# bp - build prod
import os
import subprocess
import re
import yaml

def Main():
    script_dir = os.path.dirname(os.path.realpath(__file__))
    parent_dir = os.path.dirname(script_dir)
    
    docker_compose_path = os.path.join(parent_dir, 'docker-compose.override.prod.yml')

    with open(docker_compose_path, 'r') as file:
        docker_compose = yaml.safe_load(file)

    if 'proxy' in docker_compose['services']:
        env = docker_compose['services']['proxy'].get('environment', {})
        
        key, value = env[0].split('=')
        os.environ['ROUTE'] = value

        if 'ROUTE' == key:
            
            env_path = os.path.join(parent_dir, 'web', '.env')
            
            with open(env_path, 'r') as file:
                env_content = file.read()
            
            env_content = re.sub(r'(?<=VITE_BASE_PATH=).*', value, env_content)
            
            with open(env_path, 'w') as file:
                file.write(env_content)

            subprocess.run([
                "docker-compose", 
                "-f", "docker-compose.base.yml",
                "-f", "docker-compose.prod.yml",
                "-f", "docker-compose.override.prod.yml",
                "build"
            ], cwd=parent_dir, env=os.environ)
        else:
            print("ROUTE is not set for 'proxy' service")
    else:
        print("'proxy' service is not found in docker-compose.override.prod.yml")

if __name__ == '__main__':
    Main()