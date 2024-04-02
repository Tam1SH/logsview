#!/usr/bin/python3
# bac - build api client
from ApiGenerator import ApiGenerator
import os


def Main():
	script_dir = os.path.dirname(os.path.realpath(__file__))
	parent_dir = os.path.dirname(script_dir)

	generator = ApiGenerator(parent_dir)
	generator.generate_api()

if __name__ == '__main__':
	Main()


