#!/usr/bin/env ruby

require 'xcodeproj'
require 'fileutils'
require 'digest'

# Debug mode
DEBUG = ENV['DEBUG'] == '1'

# Helper functions
def debug(message)
  puts "[DEBUG] #{message}" if DEBUG
end

def log(message, symbol = "")
  puts "#{symbol} #{message}"
end

def log_success(message)
  log(message, "✅")
end

def log_warning(message)
  log(message, "⚠️")
end

def log_error(message)
  log(message, "❌")
end

def log_info(message)
  log(message, "📝")
end

# Project-specific functions
def find_group_by_name(parent_group, name)
  return parent_group if parent_group.name == name

  parent_group.groups.each do |group|
    result = find_group_by_name(group, name)
    return result if result
  end

  nil
end

def print_groups(group, indent = 0)
  puts "#{' ' * indent}+ #{group.name || 'Main Group'}"
  group.groups.each do |subgroup|
    print_groups(subgroup, indent + 2)
  end
end

def find_and_remove_group(project, name)
  # Try to find the group using deep search
  group_to_remove = find_group_by_name(project.main_group, name)

  if group_to_remove
    log_info("Found existing #{name} group - removing it")
    debug "Group path: #{group_to_remove.hierarchy_path}"

    # Remove all file references from build phases
    if group_to_remove.recursive_children.any?
      remove_files_from_build_phases(project, group_to_remove)
    end

    # Remove the group itself
    group_to_remove.remove_from_project
    return true
  end

  return false
end

def remove_files_from_build_phases(project, group)
  project.targets.each do |target|
    target.build_phases.each do |phase|
      # Check phase type dynamically instead of using the class name directly
      next unless phase.is_a?(Xcodeproj::Project::AbstractBuildPhase) ||
                  phase.class.name.end_with?('BuildPhase')

      files_to_remove = []
      phase.files.each do |build_file|
        next unless build_file.file_ref

        if group.recursive_children.include?(build_file.file_ref)
          files_to_remove << build_file
          debug "Removing file from build phase: #{build_file.file_ref.path}"
        end
      end

      # Remove files from the phase
      files_to_remove.each do |build_file|
        phase.remove_build_file(build_file)
      end
    end
  end
end

def find_widgets_core_group(project)
  # Look for common parent group names
  ['WidgetsCore', 'Widgets', 'Sources'].each do |group_name|
    group = find_group_by_name(project.main_group, group_name)
    if group
      log_success("Found #{group_name} group")
      debug "Group path: #{group.hierarchy_path}"
      return group
    end
  end

  # If we still can't find it, look in common places
  project.main_group.groups.each do |group|
    # Look inside the main project group or similarly named groups
    if ['Uniswap', 'App', 'Sources'].include?(group.name)
      group.groups.each do |subgroup|
        if subgroup.name && ['WidgetsCore', 'Widgets', 'Sources'].include?(subgroup.name)
          log_success("Found #{subgroup.name} group under #{group.name}")
          debug "Group path: #{subgroup.hierarchy_path}"
          return subgroup
        end
      end
    end
  end

  # If still not found, create it
  log_error("Could not find WidgetsCore group in project")
  log_info("Creating WidgetsCore group under project root...")

  group = project.main_group.new_group('WidgetsCore')
  debug "Created new group: #{group.hierarchy_path}"
  return group
end

def find_target(project, target_name)
  target = project.targets.find { |t| t.name == target_name }

  if target.nil?
    log_error("Could not find #{target_name} target in project")

    # If we can't find the target by name, let's find a suitable alternative
    # Look for a framework target that might be similar
    framework_targets = project.targets.select { |t| t.product_type.include?('framework') }

    if framework_targets.empty?
      log_error("No framework targets found. Please specify the correct target in the script.")
      exit 1
    else
      # Choose the first framework target as a fallback
      target = framework_targets.first
      log_info("Using '#{target.name}' as the target instead")
    end
  end

  return target
end

def ensure_directory_exists(directory_path)
  unless Dir.exist?(directory_path)
    log_warning("Directory doesn't exist at #{directory_path}")
    log_info("Creating directory...")
    begin
      FileUtils.mkdir_p(directory_path)
      log_success("Created directory #{directory_path}")
    rescue => e
      log_error("Failed to create directory: #{e.message}")
    end
  end
end

# Generate a fingerprint of all Swift files in the directory
def generate_files_fingerprint(directory)
  swift_files = Dir.glob("#{directory}/**/*.swift").sort
  return nil if swift_files.empty?

  # Create a digest of file paths and their contents to detect any change
  digest = Digest::SHA256.new
  swift_files.each do |file_path|
    digest.update(file_path)
    digest.update(File.read(file_path)) if File.exist?(file_path)
  end
  digest.hexdigest
end

# Check if the MobileSchema group in the project matches the files on disk
def files_changed?(project, mobile_schema_dir)
  # Generate a fingerprint of the current files
  current_fingerprint = generate_files_fingerprint(mobile_schema_dir)

  # If no files exist, we need to make sure there's no group in the project
  if current_fingerprint.nil?
    existing_group = find_group_by_name(project.main_group, 'MobileSchema')
    return existing_group != nil
  end

  # Get the previous fingerprint from a temporary file
  fingerprint_file = File.join(File.dirname(mobile_schema_dir), '.mobileschema_fingerprint')
  previous_fingerprint = File.exist?(fingerprint_file) ? File.read(fingerprint_file).strip : nil

  # If fingerprints are different, update the fingerprint file and return true
  if current_fingerprint != previous_fingerprint
    FileUtils.mkdir_p(File.dirname(fingerprint_file)) unless Dir.exist?(File.dirname(fingerprint_file))
    File.write(fingerprint_file, current_fingerprint)
    return true
  end

  return false
end

def add_files_to_project(project, mobile_schema_group, mobile_schema_dir, target)
  # Find all Swift files in MobileSchema directory
  swift_files = Dir.glob("#{mobile_schema_dir}/**/*.swift").sort

  if swift_files.empty?
    log_warning("No Swift files found in #{mobile_schema_dir}!")
    log_info("Make sure GraphQL code generation completed successfully.")

    # Save project structure anyway
    project.save
    log_success("Project structure was updated (but no files were added)")
    return
  end

  log_info("Found #{swift_files.length} Swift files in MobileSchema directory")
  debug "Swift files:"
  swift_files.each { |f| debug "  - #{f}" } if DEBUG

  # Create subgroups based on directory structure
  swift_dirs = group_files_by_directory(swift_files, mobile_schema_dir)

  # Create the group structure and add files
  added_files = add_files_to_groups(swift_dirs, mobile_schema_group, target)

  if added_files > 0
    # Save project
    project.save
    log_success("Successfully added #{added_files} GraphQL files to the Xcode project")
  else
    log_warning("No GraphQL files were added")
    project.save
    log_success("Project structure was updated successfully")
  end
end

def group_files_by_directory(files, base_dir)
  dirs = {}
  files.each do |file_path|
    directory = File.dirname(file_path)
    relative_dir = directory.sub(base_dir, '')
    relative_dir = relative_dir[1..-1] if relative_dir.start_with?('/') # Remove leading slash

    dirs[relative_dir] ||= []
    dirs[relative_dir] << file_path
  end
  dirs
end

def add_files_to_groups(dirs_hash, root_group, target)
  added_files = 0

  # Sort directories to process them in a consistent order
  dirs_hash.keys.sort.each do |relative_dir|
    # Find or create group for this directory
    current_group = root_group
    unless relative_dir.empty?
      relative_dir.split('/').each do |dir_name|
        subgroup = current_group.children.find { |child|
          child.is_a?(Xcodeproj::Project::Object::PBXGroup) && child.name == dir_name
        }
        if subgroup.nil?
          subgroup = current_group.new_group(dir_name)
          debug "Created new group: #{dir_name} under #{current_group.hierarchy_path}"
        end
        current_group = subgroup
      end
    end

    # Add all files in this directory to the group
    dirs_hash[relative_dir].sort.each do |file_path|
      file_name = File.basename(file_path)

      # Add file reference
      file_ref = current_group.new_reference(file_path)
      file_ref.source_tree = '<group>'
      debug "Added file reference: #{file_path} to group #{current_group.name}"

      # Add file to build phase
      target.source_build_phase.add_file_reference(file_ref)
      debug "Added file to build phase: #{file_name}"

      log_success("Added #{file_name} to #{current_group.name} group")
      added_files += 1
    end
  end

  added_files
end

def main
  # Paths
  project_path = File.expand_path('../ios/Uniswap.xcodeproj', __dir__)
  mobile_schema_dir = File.expand_path('../ios/WidgetsCore/MobileSchema', __dir__)

  log_info("Project path: #{project_path}")
  log_info("Mobile schema directory: #{mobile_schema_dir}")
  debug "Debug mode enabled"

  # Open the Xcode project
  project = Xcodeproj::Project.open(project_path)

  # Check if files have changed before modifying the project
  unless files_changed?(project, mobile_schema_dir)
    log_success("No changes detected in GraphQL files - skipping project update")
    return
  end

  # List all targets for debugging
  log_info("Project targets:")
  project.targets.each_with_index do |target, index|
    log("#{index}. #{target.name} (#{target.product_type})")
  end

  # Find the WidgetsCore target
  widgets_core_target = find_target(project, 'WidgetsCore')

  log_info("Processing GraphQL files in #{mobile_schema_dir}")

  # List all top-level groups
  log_info("Project structure:") if DEBUG
  print_groups(project.main_group) if DEBUG

  # First, try to find the root widgets group by path
  widgets_root_path = File.expand_path('../ios/WidgetsCore', __dir__)
  debug "Looking for group containing: #{widgets_root_path}"

  # First, remove any existing MobileSchema group
  removed = find_and_remove_group(project, 'MobileSchema')
  log_info("No existing MobileSchema group found") unless removed

  # Find or create the main widget group
  widgets_core_group = find_widgets_core_group(project)

  # Create a new MobileSchema group
  log_info("Creating new MobileSchema group under #{widgets_core_group.name}...")
  mobile_schema_group = widgets_core_group.new_group('MobileSchema')
  log_success("Created MobileSchema group under #{widgets_core_group.name}")
  debug "Group path: #{mobile_schema_group.hierarchy_path}"

  # Check if directory exists
  ensure_directory_exists(mobile_schema_dir)

  # Add files to project
  add_files_to_project(project, mobile_schema_group, mobile_schema_dir, widgets_core_target)
end

# Run the main function
main
