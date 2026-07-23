import os

ENV_FILE = './.env'
DEV_ENV_FILE = './.env.dev'
SWIFT_FILE_PATHS = ['ios/WidgetsCore/Env.swift', 'ios/OneSignalNotificationServiceExtension/Env.swift']
SWIFT_ENV_VARIABLES = ['UNISWAP_API_KEY', 'STATSIG_API_KEY']

def to_swift_constant_line(key, value):
  return f'  static let {key.upper()} = "{value}"'

# Strip the surrounding double quotes (and unescape) that the config system writes
# into .env. Without this the raw `"value"` gets wrapped again into `""value""`,
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
  # Source values from .env (the unified config pulled by `config:pull`), matching how
  # babel/Metro source app config for the JS bundle so the native Swift constants stay in sync.
  # When .env is absent, fall back to the checked-in .env.dev defaults
  if not os.path.isfile(env_file):
    if os.path.isfile(DEV_ENV_FILE):
      print('No .env file located, using the checked in dev defaults')
      env_file = DEV_ENV_FILE
    else:
      print(f'ERROR: {env_file} not found; run `config:pull mobile` first.')
      exit(1)

  with open(env_file, 'r') as f:
    env_lines = f.readlines()
  env_var_declarations = process_lines(env_lines, env_variables.copy())

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
