# import os

# # List of relative or full folder paths to include (can add more if needed)
# directories = [
#     "/Users/oligurmessa/soulspect/src"
# ]

# output_file = "/Users/oligurmessa/soulspect/all.txt"
# with open(output_file, "w", encoding="utf-8") as outfile:
#     print("Script started...")
#     for dir_path in directories:
#         for root, _, files in os.walk(dir_path):
#             for file in files:
#                 if file.endswith(".tsx"):
#                     full_path = os.path.join(root, file)
#                     with open(full_path, "r", encoding="utf-8", errors="ignore") as infile:
#                         outfile.write(f"\n\n// FILE: {full_path}\n")
#                         outfile.write(infile.read())

import os

directory = "/Users/oligurmessa/soulspect"
excluded_files = [
    "/Users/oligurmessa/soulspect/all.txt",
    "/Users/oligurmessa/soulspect/package-lock.json"
]
output_file = "/Users/oligurmessa/soulspect/all_config.txt"

with open(output_file, "w", encoding="utf-8") as outfile:
    print("Script started...")
    for item in os.listdir(directory):
        full_path = os.path.join(directory, item)

        # Skip folders and excluded files
        if os.path.isdir(full_path) or full_path in excluded_files:
            continue

        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as infile:
                outfile.write(f"\n\n// FILE: {full_path}\n")
                outfile.write(infile.read())
        except Exception as e:
            print(f"Failed to read {full_path}: {e}")
