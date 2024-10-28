pub fn func_sort(mut array: Vec<i32>) -> Vec<i32> {
    let len = array.len();
    for i in 0..len {
        let mut min = i;
        for j in (i + 1)..len {
            if array[min] > array[j] {
                min = j;
            }
        }
        if min != i {
            array.swap(i, min);
        }
    }
    array
}

#[cfg(test)]
mod tests {
    use super::*;

    // #[test]
    // fn test_sort() {
    //     let input = vec![3, 2, 1];
    //     let expected_output = vec![1, 2, 3];
    //     assert_eq!(func_sort(input), expected_output);
    // }

    // #[test] 
    // fn test_sort_empty() {
    //     let input = vec![];
    //     let expected_output = vec![];
    //     assert_eq!(func_sort(input), expected_output);
    // }

    // #[test]
    // fn test_sort_double() {
    //     let input = vec![1, 2, 2, 3, 3];
    //     let expected_output = vec![1, 2, 2, 3, 3];
    //     assert_eq!(func_sort(input), expected_output);
    // }

    // #[test]
    // fn test_sort_multiple() {
    //     let input = vec![5, 5, 5, 8, 6, 9, 10];
    //     let expected_output = vec![5, 5, 5, 6, 8, 9, 10];
    //     assert_eq!(func_sort(input), expected_output);
    // }
}
