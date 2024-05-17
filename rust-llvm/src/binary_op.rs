fn func_binary_op(a: i32, b: i32, c : bool) -> bool {
    
    let ans;
    if a > b || a == b {
        ans = true;
    } else {
        ans = false;
    }

    return ans && c;
}

#[cfg(test)]
mod tests {
    use super::*;

    // #[test]
    // fn test_1_2_true() {
    //     assert_eq!(func_binary_op(1, 2, true), false);
    // }

    // #[test]
    // fn test_1_2_false() {
    //     assert_eq!(func_binary_op(1, 2, false), false);
    // }

    // #[test]
    // fn test_2_1_true() {
    //     assert_eq!(func_binary_op(2, 1, true), true);
    // }

    // #[test]
    // fn test_2_1_false() {
    //     assert_eq!(func_binary_op(2, 1, false), false);
    // }

    // #[test]
    // fn test_1_1_true() {
    //     assert_eq!(func_binary_op(1, 1, true), true);
    // }

    #[test]
    fn test_1_1_false() {
        assert_eq!(func_binary_op(1, 1, false), false);
    }
}