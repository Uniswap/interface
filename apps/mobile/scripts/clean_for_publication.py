from gitignore_parser import parse_gitignore
import logging
import os
import shutil

logging.basicConfig(level=logging.INFO)

# https://stackoverflow.com/questions/19859840/excluding-directories-in-os-walk


def main():
    logging.info("Cleaning all files from repository for public release")
    matches = parse_gitignore(".publishignore")
    delete_files = []
    delete_dirs = []
    exclude = set(["venv", "node_modules", ".git"])
    for (root, dirs, files) in os.walk("." , topdown=True):
        dirs[:] = [d for d in dirs if d not in exclude]
        for cur_dir in dirs:
            full_path = os.path.join(root, cur_dir)
            if matches(full_path):
                delete_dirs.append(full_path)
        for cur_file in files:
            full_path = os.path.join(root, cur_file)
            if matches(full_path):
                delete_files.append(full_path)
    logging.info(f"Found a total of {len(delete_dirs)} directories and {len(delete_files)} files to delete")
    delete_dirs.sort(key=lambda s: -len(s))
    delete_files.sort(key=lambda s: -len(s))
    for cur_path in delete_files:
        logging.info(f"Deleting file {cur_path}")
        os.remove(cur_path)
    for cur_path in delete_dirs:
        logging.info(f"Deleting file {cur_path}")
        shutil.rmtree(cur_path)
    logging.info("Repo successfully sanitized")


if __name__ == "__main__":
    main()
