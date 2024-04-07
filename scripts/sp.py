#!/usr/bin/python3
# sp - start prod

#!/usr/bin/python3
import os
import subprocess

def start():

	script_dir = os.path.dirname(os.path.realpath(__file__))
	parent_dir = os.path.dirname(script_dir)

	subprocess.run([
		"docker-compose", "-f", 
		"docker-compose.base.yml", "-f", 
		"docker-compose.override.prod.yml", "-f", 
		"docker-compose.prod.yml", "up"
	], cwd=parent_dir)
	
if __name__ == '__main__':
	start()
	