fn func_binary_op(a: i32, b: i32, c : bool) -> bool {
    
    let ans;
    if a > b || a == b {
        ans = true;
    } else {
        ans = false;
    }

    return ans && c;
}