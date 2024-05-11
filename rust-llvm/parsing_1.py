# Define file paths and read content
file_path = 'main.txt'
with open(file_path, 'r') as file:
    content = file.read()

import re

# Use a set to count the number of unique Rust files
rust_files = set(re.findall(r'coverage Code\(Counter\(\d+\)\) => ([^:]+)', content))
func_num = len(rust_files)

# 각 줄에서 첫 번째 숫자와 마지막 숫자를 추출하는 정규식 패턴
pattern = r'\d+:\d+'

# 주어진 문자열에서 정규식 패턴과 매칭되는 모든 결과를 찾아 추출
matches = re.findall(pattern, content)

# 첫 번째와 마지막 숫자를 추출
first_number = matches[0]
last_number = matches[-1]

# Count branches by summing ExpressionId and Code(Expression)
num_expression_ids = len(re.findall(r'coverage ExpressionId\(\d+\)', content))
num_code_expressions = len(re.findall(r'coverage Code\(Expression\(\d+\)\)', content))
num_branches = num_expression_ids + num_code_expressions

# Count statements
num_statements = len(re.findall(r'coverage Code\(Counter\(\d+\)\)', content))

# Summary output
summary = f"""Analysis Summary:
- Number of Funcs: {func_num}
    * 0: {first_number}-{last_number}
- Number of Branches: {num_branches}
- Number of Statements: {num_statements}
"""

# Display results
print(summary)
