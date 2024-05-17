fn func_if(a: i32, b: i32) -> i32 {
    if a > b {
        a
    } else if (a == b) {
        b
    } else {
        b
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_1_2() {
        assert_eq!(func_if(1, 2), 2);
    }
    
    //#[test]
    // fn test_2_1() {
    //     assert_eq!(func_if(2, 1), 2);
    // }

    // #[test]
    // fn test_1_1() {
    //     assert_eq!(func_if(1, 1), 1);
    // }
}