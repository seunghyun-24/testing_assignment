fn func_difficult_if(a: i32, b: i32, c: i32) -> i32 {
    if a > b {
        if a > c {
            a
        } else {
            c
        }
    } else if a == b && a == c {
        0
    } else {
        if b > c {
            b
        } else {
            c
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_1_2_3() {
        assert_eq!(func_difficult_if(1, 2, 3), 3);
    }

    #[test]
    fn test_3_2_1() {
        assert_eq!(func_difficult_if(3, 2, 1), 3);
    }

    #[test]
    fn test_1_1_1() {
        assert_eq!(func_difficult_if(1, 1, 1), 0);
    }

    #[test]
    fn test_1_2_2() {
        assert_eq!(func_difficult_if(1, 2, 2), 2);
    }

    #[test]
    fn test_2_1_2() {
        assert_eq!(func_difficult_if(2, 1, 2), 2);
    }

    #[test]
    fn test_2_2_1() {
        assert_eq!(func_difficult_if(2, 2, 1), 2);
    }
}