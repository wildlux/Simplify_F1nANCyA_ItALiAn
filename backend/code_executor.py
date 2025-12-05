import subprocess
import tempfile
import os
import sys
from io import StringIO
import contextlib
import ast
import re
from typing import Optional, Dict, Any

# ============================================
# ANALISI CODICE
# ============================================

def analyze_python_code(code: str) -> Dict[str, Any]:
    """Analizza codice Python e restituisce metriche"""
    try:
        tree = ast.parse(code)
        
        functions = []
        classes = []
        imports = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append({
                    'name': node.name,
                    'line': node.lineno,
                    'args': [arg.arg for arg in node.args.args]
                })
            elif isinstance(node, ast.ClassDef):
                classes.append({
                    'name': node.name,
                    'line': node.lineno,
                    'methods': [m.name for m in node.body if isinstance(m, ast.FunctionDef)]
                })
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                if isinstance(node, ast.Import):
                    imports.extend([alias.name for alias in node.names])
                else:
                    imports.append(node.module if node.module else "relative")
        
        lines = code.split('\n')
        comments = len([l for l in lines if l.strip().startswith('#')])
        
        return {
            'functions': functions,
            'classes': classes,
            'imports': list(set(imports)),
            'lines': len(lines),
            'comments': comments,
            'complexity': calculate_complexity(tree)
        }
    except Exception as e:
        return {'error': str(e)}

def calculate_complexity(tree) -> int:
    """Calcola complessità ciclomatica"""
    complexity = 1
    for node in ast.walk(tree):
        if isinstance(node, (ast.If, ast.For, ast.While, ast.ExceptHandler)):
            complexity += 1
        elif isinstance(node, ast.BoolOp):
            complexity += len(node.values) - 1
    return complexity

def analyze_javascript_code(code: str) -> Dict[str, Any]:
    """Analizza codice JavaScript (parsing semplice)"""
    functions = re.findall(r'function\s+(\w+)\s*\(|const\s+(\w+)\s*=\s*\(.*?\)\s*=>', code)
    classes = re.findall(r'class\s+(\w+)', code)
    imports = re.findall(r'^import\s+.+$', code, re.MULTILINE)
    
    lines = code.split('\n')
    comments = len([l for l in lines if l.strip().startswith('//')])
    
    return {
        'functions': [f[0] or f[1] for f in functions],
        'classes': classes,
        'imports': imports,
        'lines': len(lines),
        'comments': comments
    }

# ============================================
# ESECUZIONE SICURA CODICE
# ============================================

def execute_python_safe(code: str, timeout: int = 5) -> tuple:
    """Esegue Python in modo sicuro con timeout"""
    import time
    start_time = time.time()
    
    # Cattura output
    output_buffer = StringIO()
    error_buffer = StringIO()
    
    try:
        # Ambiente limitato
        safe_globals = {
            '__builtins__': {
                'print': print,
                'range': range,
                'len': len,
                'str': str,
                'int': int,
                'float': float,
                'list': list,
                'dict': dict,
                'sum': sum,
                'max': max,
                'min': min,
                'abs': abs,
                'round': round,
                'sorted': sorted,
                'enumerate': enumerate,
                'zip': zip,
                'map': map,
                'filter': filter,
            }
        }
        
        # Esegui con cattura output
        with contextlib.redirect_stdout(output_buffer), contextlib.redirect_stderr(error_buffer):
            exec(code, safe_globals)
        
        execution_time = time.time() - start_time
        return True, output_buffer.getvalue(), error_buffer.getvalue(), execution_time
        
    except Exception as e:
        execution_time = time.time() - start_time
        return False, output_buffer.getvalue(), str(e), execution_time

def execute_javascript_node(code: str, timeout: int = 5) -> tuple:
    """Esegue JavaScript con Node.js"""
    import time
    start_time = time.time()
    temp_file = None

    try:
        # Crea file temporaneo
        with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
            f.write(code)
            temp_file = f.name
        
        # Esegui con Node.js
        result = subprocess.run(
            ['node', temp_file],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        execution_time = time.time() - start_time
        
        # Pulisci
        os.unlink(temp_file)
        
        return result.returncode == 0, result.stdout, result.stderr, execution_time
        
    except subprocess.TimeoutExpired:
        if temp_file and os.path.exists(temp_file):
            os.unlink(temp_file)
        return False, "", "Timeout: esecuzione troppo lunga", timeout
    except FileNotFoundError:
        return False, "", "Node.js non installato", 0
    except Exception as e:
        return False, "", str(e), 0

def execute_cpp_code(code: str, timeout: int = 10) -> tuple:
    """Compila ed esegue C++"""
    import time
    start_time = time.time()
    
    try:
        # Crea file sorgente
        with tempfile.NamedTemporaryFile(mode='w', suffix='.cpp', delete=False) as f:
            f.write(code)
            source_file = f.name
        
        # Nome eseguibile
        exe_file = source_file.replace('.cpp', '')
        
        # Compila
        compile_result = subprocess.run(
            ['g++', source_file, '-o', exe_file, '-std=c++17'],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        if compile_result.returncode != 0:
            os.unlink(source_file)
            return False, "", f"Errore compilazione:\n{compile_result.stderr}", time.time() - start_time
        
        # Esegui
        run_result = subprocess.run(
            [exe_file],
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        execution_time = time.time() - start_time
        
        # Pulisci
        os.unlink(source_file)
        if os.path.exists(exe_file):
            os.unlink(exe_file)
        
        return run_result.returncode == 0, run_result.stdout, run_result.stderr, execution_time
        
    except subprocess.TimeoutExpired:
        return False, "", "Timeout: esecuzione troppo lunga", timeout
    except FileNotFoundError:
        return False, "", "g++ non installato", 0
    except Exception as e:
        return False, "", str(e), 0

# ============================================
# UTILITY FUNCTIONS
# ============================================

def get_supported_languages():
    """Restituisce linguaggi supportati"""
    return {
        'languages': [
            {
                'name': 'Python',
                'value': 'python',
                'execution': True,
                'analysis': True
            },
            {
                'name': 'JavaScript',
                'value': 'javascript',
                'execution': True,
                'analysis': True
            },
            {
                'name': 'C++',
                'value': 'cpp',
                'execution': True,
                'analysis': False
            },
            {
                'name': 'TypeScript',
                'value': 'typescript',
                'execution': False,
                'analysis': True
            }
        ]
    }
