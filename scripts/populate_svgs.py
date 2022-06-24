import os
from os.path import isfile, join


def find_closing_quote_index(s, starting_index=0):
    for i in range(starting_index, len(s)):
        if s[i] == '"':
            return i
    return None


def grab_svg_attribute_prop(prop_name, line):
    # if prop_name = fill-rule, then this function
    # will return the string between the quotes:
    # <path fill-rule="<whatever>" --> returns <whatever>
    i = line.index(f"{prop_name}=")
    idx_after_quote = i + len(prop_name) + 2
    j = find_closing_quote_index(line, idx_after_quote)
    if not j:
        return None
    return line[idx_after_quote:j]


folder_location = "../src/assets/unicons/"
folders = ["Container", "Emblem"]
unicons_location = '../src/components/unicons'


def generate_arrays_from_svgs():
    print("Generating ShapeSvg Arrays")
    for folder in folders:
        folder_path = join(folder_location, folder)
        print("Looking in", folder_path)
        print("Found", len(os.listdir(folder_path)), "files")
        result = "import { PathProps } from 'src/components/unicons/types'\nexport const svgPaths: PathProps[][] = ["
        count = 0
        for filename in os.listdir(folder_path):
            if not isfile(join(folder_path, filename)) or filename[-4:] != ".svg":
                continue
            f = open(join(folder_path, filename), "r")
            cur_svgs = []
            for line in f:
                if "svg" in line:
                    continue
                if "<path" in line:
                    cur_svg = "\n\t\t{"
                    # add line to result but make it into jsx

                    # adding the path attribute to pathProps
                    path = grab_svg_attribute_prop("d", line)
                    if path:
                        cur_svg += f"\n\t\t\tpath: '{path}',"

                    # add fillType attribute if it exists
                    if "fill-rule" in line:
                        # hard coding this for now, non hardcoded version below
                        cur_svg += f"\n\t\t\tfillType: 'evenOdd'"
                    cur_svg += "\n\t\t},"
                    cur_svgs.append(cur_svg)
            result += "\n\t["
            for svg in cur_svgs:
                result += svg
            result += "\n\t],"
            count += 1
        result += "\n]"
        f_ts = open(join(unicons_location, folder+".ts"), "w")
        f_ts.write(result)
        f_ts.close()


def delete_individual_ts_files():
    answer = input(
        f"Are you sure you want to delete all .ts and .tsx files from the following folders: {folders}? (Yes / No)\n")
    if answer != "Yes":
        print("Aborted")
        return
    print("Deleting individual .ts and .tsx files")
    for folder in folders:
        folder_path = join(folder_location, folder)
        count = 0
        print("Looking in", folder_path)
        print("Found", len(os.listdir(folder_path)), "files")
        for filename in os.listdir(folder_path):
            if not isfile(join(folder_path, filename)) or (filename[-3:] != ".ts" and filename[-4:] != ".tsx"):
                continue
            os.remove(join(folder_path, filename))
            count += 1
        print(f"Deleted {count} files from {folder_path}")


def generate_individual_ts_files():
    print("Generating individual .ts files")
    for folder in folders:
        folder_path = join(folder_location, folder)
        print("Looking in", folder_path)
        print("Found", len(os.listdir(folder_path)), "files")
        for filename in os.listdir(folder_path):
            if not isfile(join(folder_path, filename)) or filename[-4:] != ".svg":
                continue
            f = open(join(folder_path, filename), "r")
            result = "export const pathProps = {"
            for line in f:
                if "svg" in line:
                    continue
                if "<path" in line:
                    # add line to result but make it into jsx

                    # adding the path attribute to pathProps
                    path = grab_svg_attribute_prop("d", line)
                    if path:
                        result += f"\n\tpath: '{path}',"

                    # add fillType attribute if it exists
                    if "fill-rule" in line:
                        # hard coding this for now, non hardcoded version below
                        result += f"\n\tfillType: 'evenOdd'"
                        # i = line.index("fill-rule") + 10
                        # if j:
                        #     j = find_closing_quote_index(line, i+1)
                        #     result += f"\n\tfillType: '{line[i+1:j]}'"

                    # write the result to new file
                    result += "\n}\n"
                    f_tsx = open(join(folder_path, filename[:-4]+".ts"), "w")
                    f_tsx.write(result)
                    f_tsx.close()
    print("Done generating individual ts files")


if __name__ == "__main__":
    generate_arrays_from_svgs()
