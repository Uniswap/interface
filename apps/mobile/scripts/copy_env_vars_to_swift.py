import os

ENV_FILE = './.env.new'
SWIFT_FILE_PATHS = ['ios/WidgetsCore/Env.swift', 'ios/OneSignalNotificationServiceExtension/Env.swift']
SWIFT_ENV_VARIABLES = ['UNISWAP_API_KEY', 'STATSIG_API_KEY']

def to_swift_constant_line(key, value):
  return f'  static let {key.upper()} = "{value}"'

# Strip the surrounding double quotes (and unescape) that the config system writes
# into .env.new. Without this the raw `"value"` gets wrapped again into `""value""`,
# producing invalid Swift. A no-op for unquoted values from older env sources.
def unquote_env_value(value):
  value = value.strip()
  if len(value) >= 2 and value[0] == '"' and value[-1] == '"':
    inner = value[1:-1]
    return inner.replace('\\"', '"').replace('\\n', '\n').replace('\\r', '\r').replace('\\\\', '\\')
  return value

def process_lines(lines, search_vars):
  env_var_declarations = []
  for line in lines:
    line = line.strip()
    if line and not line.startswith('#'):
      # Split variable name and value
      key, value = line.split('=', 1)
      if key in search_vars:
        env_var_declarations.append(to_swift_constant_line(key.upper(), unquote_env_value(value)))
        search_vars.remove(key)

  return env_var_declarations

# convert env variables to swift constants and writes to a swift file.
def copy_env_vars_to_swift(env_file, swift_files, env_variables):
  envs_left_to_find = env_variables.copy()
  env_var_declarations = []

  # Search for env vars in the system first
  for key in env_variables:
    if key in os.environ:
      env_var_declarations.append(to_swift_constant_line(key.upper(), os.environ[key]))
      envs_left_to_find.remove(key)

  # read from env file if it exists
  if os.path.isfile(env_file):
    with open(env_file, 'r') as f:
      env_lines = f.readlines()
    env_var_declarations.extend(process_lines(env_lines, envs_left_to_find))

  # write to swift file
  for swift_file in swift_files:
    with open(swift_file, 'w') as f:
      f.write('struct Env {\n')
      f.write('\n'.join(env_var_declarations))
      f.write('\n}')

  # If not all env variables are set
  if len(env_variables) != len(env_var_declarations):
    print('WARNING: Not all environment variables were converted to Swift.')
    exit(1)

copy_env_vars_to_swift(ENV_FILE, SWIFT_FILE_PATHS, SWIFT_ENV_VARIABLES)
