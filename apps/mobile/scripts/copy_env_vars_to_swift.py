import os

ENV_DEFAULTS_FILE = '../../.env.defaults'
ENV_DEFAULTS_LOCAL_FILE = '../../.env.defaults.local'
SWIFT_FILE_PATH = 'ios/WidgetsCore/Env.swift'
SWIFT_ENV_VARIABLES = ['UNISWAP_API_BASE_URL','UNISWAP_API_KEY']

def to_swift_constant_line(key, value):
  return f'  static let {key.upper()} = "{value}"'

def process_lines(lines, search_vars):
  env_var_declarations = []
  for line in lines:
    line = line.strip()
    if line and not line.startswith('#'):
      # Split variable name and value
      key, value = line.split('=', 1)
      if key in search_vars:
        env_var_declarations.append(to_swift_constant_line(key.upper(), value))
        search_vars.remove(key)

  return env_var_declarations

# convert env variables to swift constants and writes to a swift file.
def copy_env_vars_to_swift(env_defaults_file, env_defaults_local_file, swift_file, env_variables):
  envs_left_to_find = env_variables.copy()
  env_var_declarations = []

  # Search for env vars in the system first
  for key in env_variables:
    if key in os.environ:
      env_var_declarations.append(to_swift_constant_line(key.upper(), os.environ[key]))
      envs_left_to_find.remove(key)

  # read from local env file if it exists
  if os.path.isfile(env_defaults_local_file):
    with open(env_defaults_local_file, 'r') as f:
      env_lines = f.readlines()
    env_var_declarations.extend(process_lines(env_lines, envs_left_to_find))

  # read from checked in env file for non-secret variables
  with open(env_defaults_file, 'r') as f:
    default_env_lines = f.readlines()
  env_var_declarations.extend(process_lines(default_env_lines, envs_left_to_find))

  # write to swift file
  with open(swift_file, 'w') as f:
    f.write('struct Env {\n')
    f.write('\n'.join(env_var_declarations))
    f.write('\n}')

  # If not all env variables are set
  if len(env_variables) != len(env_var_declarations):
    print('WARNING: Not all environment variables were converted to Swift.')
    exit(1)

copy_env_vars_to_swift(ENV_DEFAULTS_FILE, ENV_DEFAULTS_LOCAL_FILE, SWIFT_FILE_PATH, SWIFT_ENV_VARIABLES)
