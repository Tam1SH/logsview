#!/usr/bin/python3
# bac - build api client
from ApiGenerator import ApiGenerator
from colorama import init, Fore
import os

init()


def Main():
	script_dir = os.path.dirname(os.path.realpath(__file__))
	parent_dir = os.path.dirname(script_dir)

	generator = ApiGenerator(parent_dir)
	generator.generate_api()

	print(Fore.GREEN + "successful build")

if __name__ == '__main__':
	Main()


