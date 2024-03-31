#!/usr/bin/python3

import os
import shutil
import subprocess

from dotenv import load_dotenv
load_dotenv()

class ApiGenerator:
    def __init__(self, root):
        self.root = root

    def run_commands_in_directory(self, directory, commands):
        os.chdir(os.path.join(self.root, directory))
        for command in commands:
            os.system(command)

    def copy_api(self, api_name, api_directory, folder = "openapi.g"):
        source = os.path.join(self.root, api_directory, folder, "openapi.yaml")
        
        target_dir = os.path.join(self.root, f"GenApi/openapi-doc/{api_name}")
        target_file = f"{target_dir}/{api_name}.yaml"
        
        shutil.copy(source, target_file)

    def generate_api(self):
        directory = "server"
        commands = [
            "docker exec -it logs_server cargo run -- gen"
        ]
        
        self.run_commands_in_directory(directory, commands)
        
        os.chdir(os.path.join(self.root, "server"))
        os.system(f"openapi-generator-cli generate -i schema/openapi.yaml -g typescript-fetch -o ../web/api_generator/dist/api --additional-properties=useSingleRequestParameter=false,stringEnums=true,supportsES6=true")

        os.chdir(os.path.join(self.root, "web/api_generator"))

        os.system("bun index.ts")