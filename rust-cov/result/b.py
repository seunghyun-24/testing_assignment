import re

# File paths
ast_file_path = './ast_result.txt'
covered_lines_file_path = './llvm_result.txt'
result_file_path = './result.txt'

def read_covered_lines(file_path):
    with open(file_path, 'r') as file:
        covered_lines = [int(line.strip()) for line in file.readlines()]
    return covered_lines

# Function to parse AST file and mark covered items
def parse_and_mark_ast(file_path, covered_lines):
    with open(file_path, 'r') as file:
        lines = file.readlines()
    
    output_lines = []
    counts = {'func': 0, 'stmt': 0, 'branch': 0, 'loop': 0, 'macro': 0}
    total_counts = {'func': 0, 'stmt': 0, 'branch': 0, 'loop': 0, 'macro': 0}
    
    section = None
    for line in lines:
        section_match = re.match(r'\s*-\s*(func|stmt|branch|loop|macro):\s*(\d+)', line)
        if section_match:
            section = section_match.group(1)
            total_counts[section] = int(section_match.group(2))
            output_lines.append(line)
            continue
        
        if section == 'func':
            match = re.match(r'(\s*)([-*]) (\d+): (.*): (\d+):(\d+)-(\d+):(\d+)', line)
            if match:
                indent, marker, idx, name, start_line, start_col, end_line, end_col = match.groups()
                start_line, end_line = int(start_line), int(end_line)
                if any(start_line <= line <= end_line for line in covered_lines):
                    marker = '*'
                    counts[section] += 1
                output_lines.append(f"{indent}{marker} {idx}: {name}: {start_line}:{start_col}-{end_line}:{end_col}\n")
            else:
                output_lines.append(line)
        else:
            match = re.match(r'(\s*)([-*]) (\d+): (\d+):(\d+)-(\d+):(\d+)', line)
            if match:
                indent, marker, idx, start_line, start_col, end_line, end_col = match.groups()
                start_line, end_line = int(start_line), int(end_line)
                if any(start_line <= line <= end_line for line in covered_lines):
                    marker = '*'
                    counts[section] += 1
                output_lines.append(f"{indent}{marker} {idx}: {start_line}:{start_col}-{end_line}:{end_col}\n")
            else:
                output_lines.append(line)
            
    # Adding coverage statistics to the output
    for i, line in enumerate(output_lines):
        section_match = re.match(r'\s*-\s*(func|stmt|branch|loop|macro):\s*(\d+)', line)
        if section_match:
            section = section_match.group(1)
            covered_count = counts[section]
            total_count = total_counts[section]
            percentage = (covered_count / total_count) * 100 if total_count > 0 else 0
            output_lines[i] = f" - {section}: {covered_count}/{total_count} ({percentage:.2f}%)\n"
    
    return output_lines

# Main function to process the files
def main():
    covered_lines = read_covered_lines(covered_lines_file_path)
    modified_ast_lines = parse_and_mark_ast(ast_file_path, covered_lines)
    
    with open(result_file_path, 'w') as result_file:
        result_file.writelines(modified_ast_lines)

# Run the main function
if __name__ == "__main__":
    main()